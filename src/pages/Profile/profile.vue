<template>
  <view class="page-container">
    <!-- 未登录状态：显示登录界面 -->
    <view v-if="!isLoggedIn" class="login-section">
      <view class="login-card">
        <view class="title">账号登录 / 注册</view>

        <view class="form-item">
          <text class="label">手机号</text>
          <input v-model.trim="loginForm.phone" type="text" placeholder="请输入手机号" />
        </view>
        <view class="form-item">
          <text class="label">密码</text>
          <input v-model.trim="loginForm.password" type="password" placeholder="请输入密码" />
        </view>

        <button :loading="loginLoading" @click="handleLogin" class="login-btn">
          {{ isRegistering ? '注册并登录' : '登录' }}
        </button>

        <view v-if="loginErrorMsg" class="error-msg">
          <text>{{ loginErrorMsg }}</text>
        </view>

        <view class="toggle">
          <text @click="isRegistering = !isRegistering">
            {{ isRegistering ? '已有账号？去登录' : '没有账号？去注册' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 已登录状态：显示用户信息和功能 -->
    <template v-else>
      <view class="section-header">
        <text class="welcome-text">欢迎，{{ userInfo.phone }}</text>
        <button class="logout-btn" @click="logout">退出登录</button>
      </view>

      <view class="section-card">
        <view class="section-title">居民信息</view>
        <view class="info-form">
          <view class="form-item">
            <text class="item-label">手机号</text>
            <text class="item-value">{{ userInfo.phone }}</text>
          </view>
          <view class="form-item">
            <text class="item-label">姓名</text>
            <input v-model.trim="userInfo.name" placeholder="请输入您的姓名" />
          </view>
          <view class="form-item">
            <text class="item-label">楼宇门牌</text>
            <input v-model.trim="userInfo.address" placeholder="例如：A栋1单元202" />
          </view>
        </view>
        <button class="save-btn" :loading="loading" @click="saveInfo">保存信息</button>
        <view v-if="result" class="result">
          <text :class="{'success': result.success, 'error': !result.success}">
            {{ result.message }}
          </text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-title">历史记录</view>
        <view class="history-list">
          <view v-if="loadingHistory" class="loading-history">
            <text>加载中...</text>
          </view>
          <view v-else-if="historyList.length === 0" class="empty-history">
            <text>暂无历史记录</text>
          </view>
          <view class="history-item" v-for="item in historyList" :key="item.id" @click="viewHistoryDetail(item)">
            <view class="item-content">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-date">{{ item.date }}</text>
              <text v-if="item.category" class="item-category">{{ item.category }}</text>
              <!-- 自定义进度条 -->
              <view class="progress-container">
                <view class="progress-bar">
                  <view class="progress-fill" :style="{width: item.progress + '%', backgroundColor: getProgressColor(item.status)}"></view>
                </view>
              </view>
            </view>
            <view class="item-status" :class="{'status-processed': item.status === '已处理'}">
              {{ item.status }}
            </view>
            <text class="item-arrow">></text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 登录状态
      isLoggedIn: false,
      currentUserId: '',
      
      // 登录表单
      loginForm: {
        phone: '',
        password: ''
      },
      loginLoading: false,
      loginErrorMsg: '',
      isRegistering: false,
      
      // 用户信息
      userInfo: { 
        phone: '', 
        name: '', 
        address: '' 
      },
      loading: false,
      result: null,
      
      // 历史记录
      historyList: [],
      loadingHistory: false
    }
  },
  
  onLoad() {
    this.checkLoginStatus();
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
    if (this.isLoggedIn) {
      this.loadHistoryList();
    }
  },

  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const isLoggedIn = uni.getStorageSync('is_logged_in');
      const currentUserId = uni.getStorageSync('current_user_id');
      
      console.log('检查登录状态:', { isLoggedIn, currentUserId });
      
      if (isLoggedIn && currentUserId) {
        this.isLoggedIn = true;
        this.currentUserId = currentUserId;
        // 加载用户信息
        this.loadUserInfo();
      } else {
        this.isLoggedIn = false;
        this.currentUserId = '';
        // 清空用户信息
        this.userInfo = { phone: '', name: '', address: '' };
        this.historyList = [];
      }
    },

    // 登录处理
    async handleLogin() {
      if (!this.loginForm.phone || !this.loginForm.password) {
        this.loginErrorMsg = '手机号和密码不能为空';
        return;
      }
      
      // 手机号格式验证
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(this.loginForm.phone)) {
        this.loginErrorMsg = '请输入正确的手机号格式';
        return;
      }
      
      this.loginLoading = true;
      this.loginErrorMsg = '';

      const db = uniCloud.database();
      const usersCol = db.collection('demo-user');

      try {
        console.log('登录请求 - 手机号:', this.loginForm.phone);

        // 查询手机号
        const queryRes = await usersCol.where({ 
          phone: this.loginForm.phone 
        }).get();
        
        const records = Array.isArray(queryRes.result?.data) 
          ? queryRes.result.data 
          : [];

        if (records.length === 0) {
          // 未注册
          if (this.isRegistering) {
            // 注册新用户
            const addRes = await usersCol.add({
              phone: this.loginForm.phone,
              password: this.loginForm.password,
              name: '',
              address: ''
            });
            
            const userId = addRes.id;
            
            // 保存登录状态和用户信息
            uni.setStorageSync('current_user_id', userId);
            uni.setStorageSync('is_logged_in', true);
            uni.setStorageSync('userid', userId);
            uni.setStorageSync('userInfo', {
              phone: this.loginForm.phone,
              name: '',
              address: ''
            });
            
            // 设置当前状态
            this.currentUserId = userId;
            this.userInfo = {
              phone: this.loginForm.phone,
              name: '',
              address: ''
            };
            this.isLoggedIn = true;
            
            // 清空登录表单
            this.loginForm = { phone: '', password: '' };
            
            uni.showToast({
              title: '注册成功',
              icon: 'success'
            });
            
            // 不需要跳转，直接显示用户信息界面
            
          } else {
            this.loginErrorMsg = '手机号未注册，请先注册';
          }
        } else {
          // 已有用户
          const user = records[0];
          if (this.loginForm.password === user.password) {
            // 密码正确，登录成功
            uni.setStorageSync('current_user_id', user._id);
            uni.setStorageSync('is_logged_in', true);
            uni.setStorageSync('userid', user._id);
            uni.setStorageSync('userInfo', {
              phone: user.phone || '',
              name: user.name || '',
              address: user.address || ''
            });
            
            // 设置当前状态
            this.currentUserId = user._id;
            this.userInfo = {
              phone: user.phone || '',
              name: user.name || '',
              address: user.address || ''
            };
            this.isLoggedIn = true;
            
            // 清空登录表单
            this.loginForm = { phone: '', password: '' };
            
            // 加载历史记录
            if (this.userInfo.phone) {
              this.loadHistoryList();
            }
            
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            });
            
            // 不需要跳转，直接显示用户信息界面
            
          } else {
            this.loginErrorMsg = '密码错误';
          }
        }
      } catch (e) {
        console.error('登录异常:', e);
        this.loginErrorMsg = e.message || '登录失败，请稍后重试';
      } finally {
        this.loginLoading = false;
      }
    },

    // 加载用户信息
    async loadUserInfo() {
      if (!this.currentUserId) {
        return;
      }

      try {
        const db = uniCloud.database();
        const queryRes = await db.collection('demo-user')
          .doc(this.currentUserId)
          .get();

        console.log('加载用户信息结果:', queryRes);

        if (queryRes.result?.data && queryRes.result.data.length > 0) {
          const userData = queryRes.result.data[0];
          this.userInfo = {
            phone: userData.phone || '',
            name: userData.name || '',
            address: userData.address || ''
          };
          
          // 同步到本地存储
          uni.setStorageSync('userInfo', this.userInfo);
          console.log('用户信息已加载:', this.userInfo);
          
        } else {
          console.log('未找到用户数据，可能用户被删除');
          // 如果用户数据不存在，清除登录状态
          this.logout();
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },

    // 保存用户信息
    async saveInfo() {
      // 表单校验
      const { phone, name, address } = this.userInfo;
      if (!phone || !name || !address) {
        return uni.showToast({ 
          title: '请填写完整的居民信息', 
          icon: 'none' 
        });
      }

      this.loading = true;
      this.result = null;

      try {
        const db = uniCloud.database();
        
        // 更新数据库中的用户信息
        const updateRes = await db.collection('demo-user')
          .doc(this.currentUserId)
          .update({
            name: name,
            address: address
          });

        if (updateRes.result.updated > 0) {
          // 同时保存到本地存储
          uni.setStorageSync('userInfo', this.userInfo);
          
          this.result = { success: true, message: '保存成功' };
          
          // 3秒后清除提示
          setTimeout(() => {
            this.result = null;
          }, 3000);
          
        } else {
          this.result = { success: false, message: '保存失败' };
        }

      } catch (error) {
        console.error('保存用户信息失败:', error);
        this.result = { 
          success: false, 
          message: error.message || '保存失败，请稍后重试' 
        };
      } finally {
        this.loading = false;
      }
    },

    // 退出登录
    logout() {
      // 如果是自动退出（数据不存在），直接清理
      const isAutoLogout = arguments[0] === 'auto';
      
      if (isAutoLogout) {
        this.performLogout();
      } else {
        // 手动退出，显示确认框
        uni.showModal({
          title: '确认退出',
          content: '确定要退出登录吗？',
          success: (res) => {
            if (res.confirm) {
              this.performLogout();
            }
          }
        });
      }
    },

    // 执行退出登录操作
    performLogout() {
      // 清除所有登录相关存储
      uni.removeStorageSync('is_logged_in');
      uni.removeStorageSync('current_user_id');
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('userid');
      
      // 重置所有数据状态
      this.isLoggedIn = false;
      this.currentUserId = '';
      this.userInfo = { phone: '', name: '', address: '' };
      this.historyList = [];
      this.loginForm = { phone: '', password: '' };
      this.loginErrorMsg = '';
      this.isRegistering = false;
      this.result = null;
      
      uni.showToast({
        title: '已退出登录',
        icon: 'success'
      });
    },

    // 查看历史详情
    viewHistoryDetail(item) {
      console.log('查看历史详情:', item);
      // 暂时显示详情弹窗，您可以后续创建详情页面
      uni.showModal({
        title: '问题详情',
        content: `问题描述: ${item.description || '无描述'}\n状态: ${item.status || '待处理'}\n提交时间: ${this.formatDate(item.reportTime)}`,
        showCancel: false
      });
    },

    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '';
      
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('日期格式化失败:', error);
        return dateStr;
      }
    },

    // 根据状态获取进度条颜色
    getProgressColor(status) {
      if (status === '已处理') {
        return '#4cd964';
      } else if (status === '处理中') {
        return '#ff9900';
      }
      return '#007AFF';
    },

    // 加载历史记录
    async loadHistoryList() {
      if (!this.userInfo.phone) {
        console.log('用户手机号为空，跳过加载历史记录');
        return;
      }

      this.loadingHistory = true;

      try {
        const getUserHistory = uniCloud.importObject('getUserHistory');
        const response = await getUserHistory.getUserHistory({
          phone: this.userInfo.phone
        });

        console.log('历史记录加载结果:', response);

        if (response.code === 200) {
          this.historyList = response.data || [];
        } else {
          console.error('获取历史记录失败：', response.message);
          this.historyList = [];
        }
      } catch (error) {
        console.error('获取历史记录异常：', error);
        this.historyList = [];
        uni.showToast({
          title: '获取历史记录失败',
          icon: 'none'
        });
      } finally {
        this.loadingHistory = false;
      }
    }
  }
}
</script>

<style>
.page-container {
  background-color: #f4f4f4;
  min-height: 100vh;
  padding: 20rpx;
}

/* 登录界面样式 */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  width: 90%;
  max-width: 600rpx;
  padding: 60rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 60rpx;
  color: #333;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  width: 140rpx;
  font-size: 30rpx;
  color: #333;
}

.form-item input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: #007AFF;
  color: #fff;
  font-size: 32rpx;
  border-radius: 12rpx;
  margin-top: 40rpx;
}

.error-msg {
  margin-top: 20rpx;
  color: #ff3b30;
  text-align: center;
  font-size: 28rpx;
}

.toggle {
  margin-top: 30rpx;
  text-align: center;
}

.toggle text {
  color: #007AFF;
  font-size: 28rpx;
}

/* 已登录界面样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.welcome-text {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.logout-btn {
  font-size: 28rpx;
  color: #007AFF;
  background: none;
  padding: 10rpx 20rpx;
  border: 1rpx solid #007AFF;
  border-radius: 20rpx;
}

.section-card {
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
}

.info-form .form-item {
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-label {
  width: 180rpx;
  font-size: 30rpx;
  color: #333;
}

.item-value {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.info-form input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.save-btn {
  background-color: #007AFF;
  color: white;
  margin-top: 30rpx;
  font-size: 32rpx;
  height: 88rpx;
  border-radius: 12rpx;
}

.save-btn:active {
  background-color: #0056b3;
}

.result {
  margin-top: 20rpx;
  text-align: center;
  font-size: 28rpx;
}

.result .success {
  color: #4cd964;
}

.result .error {
  color: #ff3333;
}

.empty-history, .loading-history {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
  font-size: 28rpx;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:active {
  background-color: #fafafa;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.item-date {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.item-category {
  font-size: 22rpx;
  color: #007AFF;
  background-color: #f0f8ff;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
  display: inline-block;
  width: fit-content;
}

.item-status {
  font-size: 26rpx;
  color: #ff9900;
  margin-right: 20rpx;
  font-weight: 500;
}

.status-processed {
  color: #4cd964;
}

.item-arrow {
  font-size: 30rpx;
  color: #ccc;
}

/* 进度条样式 */
.progress-container {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}
</style>
