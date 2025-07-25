<template>
  <view class="login-container">
    <view class="login-card">
      <view class="title">账号登录 / 注册</view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model.trim="phone" type="text" placeholder="请输入手机号" />
      </view>
      <view class="form-item">
        <text class="label">密码</text>
        <input v-model.trim="password" type="password" placeholder="请输入密码" />
      </view>

      <button :loading="loading" @click="handleLogin">
        {{ isRegistering ? '注册并登录' : '登录' }}
      </button>

      <view v-if="errorMsg" class="error-msg">
        <text>{{ errorMsg }}</text>
      </view>

      <view class="toggle">
        <text @click="isRegistering = !isRegistering">
          {{ isRegistering ? '已有账号？去登录' : '没有账号？去注册' }}
        </text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      phone: '',
      password: '',
      loading: false,
      errorMsg: '',
      isRegistering: false
    }
  },
  methods: {
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
.login-container { flex: 1; display: flex; justify-content: center; align-items: center; background: #f4f4f4; }
.login-card { width: 90%; max-width: 400rpx; padding: 30rpx; background: #fff; border-radius: 16rpx; }
.title { font-size: 36rpx; font-weight: bold; text-align: center; margin-bottom: 40rpx; }
.form-item { display: flex; align-items: center; margin-bottom: 30rpx; }
.label { width: 140rpx; font-size: 30rpx; }
input { flex: 1; font-size: 30rpx; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 10rpx; }
button { width: 100%; height: 72rpx; background: #007AFF; color: #fff; font-size: 32rpx; border-radius: 8rpx; }
.error-msg { margin-top: 20rpx; color: #ff3b30; text-align: center; }
.toggle { margin-top: 20rpx; text-align: center; }
.toggle text { color: #007AFF; }
</style>