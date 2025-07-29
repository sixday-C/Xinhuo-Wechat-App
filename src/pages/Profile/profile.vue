<template>
  <view class="page-container">
    <!-- 用户头部信息 -->
    <view class="user-header">
      <view class="user-info">
        <text class="username">{{ getUserDisplayName() }}</text>
        <text class="user-desc">{{ userInfo.address || '请完善地址信息' }}</text>
      </view>
    </view>

    <!-- 用户信息编辑 -->
    <view class="section-card">
      <view class="section-title">个人信息</view>
      <view class="info-form">
        <view class="form-item">
          <text class="item-label">手机号</text>
          <text class="item-value readonly">{{ userInfo.phone || '未绑定' }}</text>
        </view>
        <view class="form-item">
          <text class="item-label">姓名</text>
          <input 
            v-model.trim="editInfo.name" 
            placeholder="请输入您的真实姓名" 
            class="item-input"
          />
        </view>
        <view class="form-item">
          <text class="item-label">地址</text>
          <input 
            v-model.trim="editInfo.address" 
            placeholder="例如：A栋1单元202" 
            class="item-input"
          />
        </view>
      </view>
      
      <button class="save-btn" :loading="saving" @click="saveInfo">
        保存信息
      </button>
      
      <view v-if="result" class="result">
        <text :class="{'success': result.success, 'error': !result.success}">
          {{ result.message }}
        </text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="section-card">
      <view class="section-title">功能服务</view>
      <view class="menu-list">
        <view class="menu-item" @click="viewHistory">
          <text class="menu-icon">📋</text>
          <text class="menu-text">历史记录</text>
          <text class="menu-badge" v-if="historyCount > 0">{{ historyCount }}</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="bindAccount">
          <text class="menu-icon">📱</text>
          <text class="menu-text">{{ userInfo.phone ? '换绑手机号' : '绑定手机号' }}</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="showLogoutConfirm">
        退出登录
      </button>
    </view>

    <!-- 历史记录弹出层 -->
    <view v-if="showHistory" class="history-modal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">历史记录</text>
          <text class="close-btn" @click="showHistory = false">×</text>
        </view>
        
        <view class="history-list">
          <view v-if="loadingHistory" class="loading-history">
            <text>加载中...</text>
          </view>
          <view v-else-if="historyList.length === 0" class="empty-history">
            <text>暂无历史记录</text>
          </view>
          <view 
            class="history-item" 
            v-for="item in historyList" 
            :key="item.id" 
            @click="viewHistoryDetail(item)"
          >
            <view class="item-content">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-date">{{ item.date }}</text>
              
              <!-- 简化的状态显示 -->
              <view class="status-row">
                <text class="item-status" :class="getStatusClass(item.status)">
                  {{ item.status }}
                </text>
                <view class="progress-dots">
                  <view 
                    class="dot" 
                    v-for="i in 3" 
                    :key="i"
                    :class="{ active: getProgressLevel(item.status) >= i }"
                  ></view>
                </view>
              </view>
            </view>
            <text class="item-arrow">></text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import UserManager from '@/utils/userManager.js'

export default {
  data() {
    return {
      // 用户信息（不包含敏感信息）
      userInfo: { 
        phone: '', 
        name: '', 
        address: '',
        loginType: 'password'
      },
      
      // 编辑信息
      editInfo: {
        name: '',
        address: ''
      },
      
      // 状态
      saving: false,
      result: null,
      
      // 历史记录
      showHistory: false,
      historyList: [],
      loadingHistory: false,
      historyCount: 0,
      
      // 内部标识（不显示给用户）
      hasWechatBound: false,
      bindingAccount: false
    }
  },
  
  onLoad() {
    this.checkLoginAndLoadData();
  },
  
  onShow() {
    this.checkLoginAndLoadData();
  },
  
  onPullDownRefresh() {
    this.loadUserInfo().finally(() => {
      uni.stopPullDownRefresh();
    });
  },

  methods: {
    // 检查登录状态并加载数据
    async checkLoginAndLoadData() {
      if (!UserManager.isLoggedIn()) {
        uni.reLaunch({ url: '/pages/index/index' });
        return;
      }
      
      const userInfo = UserManager.getCurrentUser();
      if (userInfo) {
        // 只取需要的字段，排除敏感信息
        this.userInfo = {
          phone: userInfo.phone || '',
          name: userInfo.name || '',
          address: userInfo.address || '',
          loginType: userInfo.loginType || 'password'
        };
        
        // 内部标识是否绑定微信（不显示给用户）
        this.hasWechatBound = !!userInfo.openid;
        
        this.editInfo = {
          name: userInfo.name || '',
          address: userInfo.address || ''
        };
      }
      
      await this.loadUserInfo();
    },

    // 加载用户信息
    async loadUserInfo() {
      try {
        const userId = UserManager.getCurrentUserId();
        if (!userId) return;
        
        const db = uniCloud.database();
        const userDoc = await db.collection('demo-user').doc(userId).get();
        
        if (userDoc.data && userDoc.data.length > 0) {
          const userData = userDoc.data[0];
          
          // 只提取需要显示的信息
          this.userInfo = {
            phone: userData.phone || '',
            name: userData.name || '',
            address: userData.address || '',
            loginType: userData.loginType || 'password'
          };
          
          // 内部状态，不暴露敏感信息
          this.hasWechatBound = !!userData.openid;
          
          this.editInfo = {
            name: userData.name || '',
            address: userData.address || ''
          };
          
          // 更新本地存储（不包含敏感信息）
          UserManager.updateUserInfo(this.userInfo);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },

    // 获取用户显示名称
    getUserDisplayName() {
      if (this.userInfo.name) {
        return this.userInfo.name;
      }
      if (this.userInfo.phone) {
        // 脱敏显示手机号
        return this.userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      }
      return '新用户';
    },

    // 保存用户信息
    async saveInfo() {
      if (!this.editInfo.name.trim()) {
        this.showResult('请输入姓名', false);
        return;
      }
      
      this.saving = true;
      
      try {
        const userId = UserManager.getCurrentUserId();
        const db = uniCloud.database();
        
        await db.collection('demo-user').doc(userId).update({
          name: this.editInfo.name.trim(),
          address: this.editInfo.address.trim(),
        });
        
        // 更新本地数据
        this.userInfo.name = this.editInfo.name.trim();
        this.userInfo.address = this.editInfo.address.trim();
        
        // 更新本地存储
        UserManager.updateUserInfo(this.userInfo);
        
        this.showResult('保存成功', true);
      } catch (error) {
        console.error('保存失败:', error);
        this.showResult('保存失败，请重试', false);
      } finally {
        this.saving = false;
      }
    },

    // 绑定或换绑手机号
    async bindAccount() {
      const isRebind = !!this.userInfo.phone;
      const title = isRebind ? '换绑手机号' : '绑定手机号';
      const content = isRebind ? '更换绑定的手机号，原手机号将无法登录' : '绑定手机号后可使用手机号密码登录';
      
      // 弹窗提示用户输入手机号和密码
      uni.showModal({
        title: title,
        content: content,
        confirmText: isRebind ? '去换绑' : '去绑定',
        success: (res) => {
          if (res.confirm) {
            this.showBindPhoneForm();
          }
        }
      });
    },

    // 显示绑定手机号表单
    showBindPhoneForm() {
      // 使用uni-app的输入框来获取手机号
      uni.showModal({
        title: '请输入手机号',
        editable: true,
        placeholderText: '请输入手机号',
        success: (res) => {
          if (res.confirm && res.content) {
            const phone = res.content.trim();
            
            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
              uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
              return;
            }
            
            this.showPasswordInput(phone);
          }
        }
      });
    },

    // 显示密码输入
    showPasswordInput(phone) {
      uni.showModal({
        title: '设置登录密码',
        editable: true,
        placeholderText: '请输入密码',
        success: (res) => {
          if (res.confirm && res.content) {
            const password = res.content.trim();
            
            if (password.length < 6) {
              uni.showToast({ title: '密码至少6位', icon: 'none' });
              return;
            }
            
            this.performBindPhone(phone, password);
          }
        }
      });
    },

    // 执行绑定手机号
    async performBindPhone(phone, password) {
      this.bindingAccount = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            action: 'bindPhone',
            userId: UserManager.getCurrentUserId(),
            phone: phone,
            password: password
          }
        });
        
        if (res.result.success) {
          this.showResult('手机号绑定成功', true);
          
          // 立即更新本地显示的手机号
          this.userInfo.phone = phone;
          
          // 更新本地存储
          const updatedUserInfo = { ...this.userInfo, phone: phone };
          UserManager.updateUserInfo(updatedUserInfo);
          
          // 重新加载完整用户信息
          await this.loadUserInfo();
        } else {
          this.showResult(res.result.error || '绑定失败', false);
        }
      } catch (error) {
        console.error('绑定手机号失败:', error);
        this.showResult('绑定失败，请重试', false);
      } finally {
        this.bindingAccount = false;
      }
    },

    // 查看历史记录
    viewHistory() {
      this.showHistory = true;
      this.loadHistoryList();
    },

    // 加载历史记录
    async loadHistoryList() {
      this.loadingHistory = true;
      
      try {
        const userId = UserManager.getCurrentUserId();
        const db = uniCloud.database();
        
        const historyRes = await db.collection('history')
          .where({ user_id: userId })
          .orderBy('createTime', 'desc')
          .limit(10) // 限制显示条数
          .get();
        
        if (historyRes.data) {
          this.historyList = historyRes.data.map(item => ({
            id: item._id,
            title: item.title || '服务申请',
            date: this.formatDate(item.createTime),
            status: item.status || '处理中'
          }));
          
          this.historyCount = historyRes.data.length;
        }
      } catch (error) {
        console.error('加载历史记录失败:', error);
        this.historyCount = 0;
      } finally {
        this.loadingHistory = false;
      }
    },

    // 显示退出确认
    showLogoutConfirm() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            this.logout();
          }
        }
      });
    },

    // 退出登录
    logout() {
      UserManager.logout();
    },

    // 显示结果
    showResult(message, success) {
      this.result = { message, success };
      setTimeout(() => {
        this.result = null;
      }, 3000);
    },

    // 获取状态样式类
    getStatusClass(status) {
      const statusMap = {
        '待处理': 'pending',
        '处理中': 'processing',
        '已处理': 'completed',
        '已完成': 'completed'
      };
      return statusMap[status] || 'pending';
    },

    // 获取进度等级
    getProgressLevel(status) {
      const levelMap = {
        '待处理': 1,
        '处理中': 2,
        '已处理': 3,
        '已完成': 3
      };
      return levelMap[status] || 1;
    },

    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return `${days}天前`;
      
      return `${date.getMonth() + 1}-${date.getDate()}`;
    },

    // 查看历史详情
    viewHistoryDetail(item) {
      uni.navigateTo({
        url: `/pages/Profile/history-detail?id=${item.id}`
      });
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

/* 用户头部 */
.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 卡片样式 */
.section-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

/* 表单样式 */
.info-form {
  margin-bottom: 30rpx;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  min-height: 80rpx;
}

.item-label {
  width: 140rpx;
  font-size: 30rpx;
  color: #666;
  flex-shrink: 0;
}

.item-value {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.item-value.readonly {
  color: #999;
}

.item-input {
  flex: 1;
  font-size: 30rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 16rpx;
  background: #fff;
}

/* 按钮样式 */
.save-btn {
  width: 100%;
  height: 72rpx;
  background: #007aff;
  color: #fff;
  font-size: 32rpx;
  border-radius: 8rpx;
  border: none;
  margin-bottom: 20rpx;
}

.logout-section {
  padding: 0 30rpx;
}

.logout-btn {
  width: 100%;
  height: 72rpx;
  background: #ff3b30;
  color: #fff;
  font-size: 32rpx;
  border-radius: 8rpx;
  border: none;
}

/* 功能菜单 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 24rpx;
  width: 60rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-badge {
  background: #ff3b30;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 8rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
  min-width: 32rpx;
  text-align: center;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}

/* 历史记录弹窗 */
.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  padding: 40rpx;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #e5e7eb;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 40rpx;
  color: #6b7280;
  padding: 10rpx;
  line-height: 1;
}

.history-list {
  max-height: 60vh;
  overflow-y: auto;
}

.loading-history, .empty-history {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.item-date {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-status {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: white;
}

.item-status.pending {
  background: #f59e0b;
}

.item-status.processing {
  background: #3b82f6;
}

.item-status.completed {
  background: #10b981;
}

.progress-dots {
  display: flex;
  gap: 8rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #e5e7eb;
  transition: background 0.3s ease;
}

.dot.active {
  background: #10b981;
}

.item-arrow {
  font-size: 28rpx;
  color: #ccc;
  margin-left: 16rpx;
}

/* 结果提示 */
.result {
  text-align: center;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-top: 20rpx;
}

.result .success {
  color: #34c759;
  background: #e8f5e8;
}

.result .error {
  color: #ff3b30;
  background: #ffeaea;
}
</style>
