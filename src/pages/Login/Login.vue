<template>
  <view class="login-container">
    <view class="login-card">
      <view class="title">账号登录 / 注册</view>

      <!-- 账号密码登录表单 -->
      <view v-if="!showWechatOnly" class="form-section">
        <view class="form-item">
          <text class="label">手机号</text>
          <input v-model.trim="phone" type="text" placeholder="请输入手机号" />
        </view>
        <view class="form-item">
          <text class="label">密码</text>
          <input v-model.trim="password" type="password" placeholder="请输入密码" />
        </view>

        <button :loading="loading" @click="handlePasswordLogin" class="primary-btn">
          {{ isRegistering ? '注册并登录' : '登录' }}
        </button>

        <view class="toggle">
          <text @click="isRegistering = !isRegistering">
            {{ isRegistering ? '已有账号？去登录' : '没有账号？去注册' }}
          </text>
        </view>
      </view>

      <!-- 微信登录部分 -->
      <view class="wechat-section">
        <view class="divider">
          <text>或</text>
        </view>
        <button :loading="wechatLoading" @click="handleWechatLogin" class="wechat-btn">
          <text class="wechat-icon">🔒</text>
          微信快速登录
        </button>
      </view>

      <!-- 错误信息 -->
      <view v-if="errorMsg" class="error-msg">
        <text>{{ errorMsg }}</text>
      </view>

      <!-- 新用户绑定手机号 -->
      <view v-if="showBindPhone" class="bind-section">
        <view class="bind-title">完善资料</view>
        <view class="bind-desc">为了更好的服务体验，请绑定手机号</view>
        
        <view class="form-item">
          <text class="label">手机号</text>
          <input v-model.trim="bindPhone" type="text" placeholder="请输入手机号" />
        </view>
        <view class="form-item">
          <text class="label">密码</text>
          <input v-model.trim="bindPassword" type="password" placeholder="请设置密码" />
        </view>
        
        <button :loading="bindLoading" @click="handleBindPhone" class="primary-btn">
          绑定并继续
        </button>
        
        <view class="skip-bind">
          <text @click="skipBind">跳过</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 账号密码登录
      phone: '',
      password: '',
      loading: false,
      isRegistering: false,
      
      // 微信登录
      wechatLoading: false,
      
      // 绑定手机号
      showBindPhone: false,
      bindPhone: '',
      bindPassword: '',
      bindLoading: false,
      currentUserId: null,
      
      // 通用
      errorMsg: '',
      showWechatOnly: false
    }
  },
  methods: {
    // 账号密码登录
    async handlePasswordLogin() {
      if (!this.phone || !this.password) {
        this.errorMsg = '手机号和密码不能为空';
        return;
      }
      
      this.loading = true;
      this.errorMsg = '';
      
      try {
        const action = this.isRegistering ? 'passwordRegister' : 'passwordLogin';
        const res = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            action,
            phone: this.phone,
            password: this.password,
            name: '',
            address: ''
          }
        });
        
        if (res.result.success) {
          this.handleLoginSuccess(res.result);
        } else {
          this.errorMsg = res.result.error || '操作失败';
        }
      } catch (error) {
        console.error('账号密码登录错误:', error);
        this.errorMsg = error.message || '登录失败';
      } finally {
        this.loading = false;
      }
    },
    
    // 微信登录
    async handleWechatLogin() {
      this.wechatLoading = true;
      this.errorMsg = '';
      
      try {
        // 调用 uni.login 获取 code
        const loginRes = await uni.login({ provider: 'weixin' });
        if (!loginRes.code) {
          throw new Error('获取微信登录凭证失败');
        }
        
        // 调用云函数进行微信登录
        const res = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            action: 'wechatLogin',
            code: loginRes.code
          }
        });
        
        if (res.result.success) {
          if (res.result.isNewUser) {
            // 新用户，显示绑定手机号界面
            this.currentUserId = res.result.userId;
            this.showBindPhone = true;
            this.showWechatOnly = true;
          } else {
            // 老用户，直接登录
            this.handleLoginSuccess(res.result);
          }
        } else {
          this.errorMsg = res.result.error || '微信登录失败';
        }
      } catch (error) {
        console.error('微信登录错误:', error);
        this.errorMsg = error.message || '微信登录失败';
      } finally {
        this.wechatLoading = false;
      }
    },
    
    // 绑定手机号
    async handleBindPhone() {
      if (!this.bindPhone || !this.bindPassword) {
        this.errorMsg = '请填写完整信息';
        return;
      }
      
      this.bindLoading = true;
      this.errorMsg = '';
      
      try {
        const res = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            action: 'bindPhone',
            userId: this.currentUserId,
            phone: this.bindPhone,
            password: this.bindPassword
          }
        });
        
        if (res.result.success) {
          uni.showToast({ title: '绑定成功' });
          this.navigateToProfile();
        } else {
          this.errorMsg = res.result.error || '绑定失败';
        }
      } catch (error) {
        console.error('绑定手机号错误:', error);
        this.errorMsg = error.message || '绑定失败';
      } finally {
        this.bindLoading = false;
      }
    },
    
    // 跳过绑定
    skipBind() {
      this.navigateToProfile();
    },
    
    // 登录成功处理
    handleLoginSuccess(result) {
      // 存储用户信息
      uni.setStorageSync('current_user_id', result.userId);
      uni.setStorageSync('user_info', result.userInfo);
      uni.setStorageSync('is_logged_in', true);
      
      uni.showToast({ title: '登录成功' });
      this.navigateToProfile();
    },
    
    // 跳转到个人中心
    navigateToProfile() {
      uni.reLaunch({ url: '/pages/Profile/profile' });
    },
    
    // 原有的方法保留作为备用
    async handleLogin() {
     if (!this.phone || !this.password) {
       this.errorMsg = '手机号和密码不能为空';
       return;
     }
     this.loading = true;
     this.errorMsg = '';
   
     const db = uniCloud.database();
     const usersCol = db.collection('demo-user');
   
     try {
       // 打印一下 phone 的类型和值，确认它真的是我们想要的字符串
       console.log('>>> phone 类型', typeof this.phone, '，值', JSON.stringify(this.phone));
   
       // 查询手机号
       const queryRes = await usersCol.where({ phone: this.phone }).get();
       // 正确地从 result.data 拿
       const records = Array.isArray(queryRes.result?.data)
         ? queryRes.result.data
         : [];
   
        if (records.length === 0) {
                 // 未注册
                 if (this.isRegistering) {
                   const addRes = await usersCol.add({
                     phone: this.phone,
                     password: this.password,
                     name: '',
                     address: ''
                   });
                   const userId = addRes.id;
                   uni.setStorageSync('current_user_id', userId);
                   uni.setStorageSync('is_logged_in', true);
                   uni.reLaunch({ url: '/pages/Profile/profile' });
                 } else {
                   this.errorMsg = '手机号未注册，请先注册';
                 }
               } else {
                 // 已有用户
                 const user = records[0];
                 if (this.password === user.password) {
                   // 密码正确
                   uni.setStorageSync('current_user_id', user._id);
                   uni.setStorageSync('is_logged_in', true);
                   uni.reLaunch({ url: '/pages/Profile/profile' });
                 } else {
                   this.errorMsg = '密码错误';
                 }
               }
             }  catch (e) {
       console.error('>>> 发生异常', e);
       this.errorMsg = e.message || '操作失败';
     } finally {
       this.loading = false;
     }
   }
  }
}
</script>

<style>
.login-container { 
  flex: 1; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background: #f4f4f4; 
  min-height: 100vh;
}

.login-card { 
  width: 90%; 
  max-width: 400rpx; 
  padding: 30rpx; 
  background: #fff; 
  border-radius: 16rpx; 
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.title { 
  font-size: 36rpx; 
  font-weight: bold; 
  text-align: center; 
  margin-bottom: 40rpx; 
  color: #333;
}

.form-section {
  margin-bottom: 30rpx;
}

.form-item { 
  display: flex; 
  align-items: center; 
  margin-bottom: 30rpx; 
}

.label { 
  width: 140rpx; 
  font-size: 30rpx; 
  color: #666;
}

input { 
  flex: 1; 
  font-size: 30rpx; 
  border: 1rpx solid #ddd; 
  border-radius: 8rpx; 
  padding: 10rpx; 
  background: #fff;
}

.primary-btn { 
  width: 100%; 
  height: 72rpx; 
  background: #007AFF; 
  color: #fff; 
  font-size: 32rpx; 
  border-radius: 8rpx; 
  border: none;
  margin-bottom: 20rpx;
}

.wechat-section {
  margin: 30rpx 0;
}

.divider {
  text-align: center;
  margin: 20rpx 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1rpx;
  background: #ddd;
}

.divider text {
  background: #fff;
  padding: 0 20rpx;
  color: #999;
  font-size: 28rpx;
}

.wechat-btn {
  width: 100%;
  height: 72rpx;
  background: #09BB07;
  color: #fff;
  font-size: 32rpx;
  border-radius: 8rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-icon {
  margin-right: 10rpx;
  font-size: 36rpx;
}

.error-msg { 
  margin-top: 20rpx; 
  color: #ff3b30; 
  text-align: center; 
  font-size: 28rpx;
}

.toggle { 
  margin-top: 20rpx; 
  text-align: center; 
}

.toggle text { 
  color: #007AFF; 
  font-size: 28rpx;
}

/* 绑定手机号样式 */
.bind-section {
  margin-top: 30rpx;
}

.bind-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 10rpx;
}

.bind-desc {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  margin-bottom: 30rpx;
}

.skip-bind {
  text-align: center;
  margin-top: 20rpx;
}

.skip-bind text {
  color: #999;
  font-size: 28rpx;
}
</style>