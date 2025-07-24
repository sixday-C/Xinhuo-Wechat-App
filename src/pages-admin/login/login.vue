<template>
  <view class="login-wrap">
    <!-- logo / 标题 -->
    <view class="title">社区助老管理后台</view>

    <!-- 密码输入框 -->
    <input
      v-model="form.pwd"
      class="input"
      type="password"
      placeholder="请输入管理员密码"
      maxlength="20"
    />

    <!-- 登录按钮 -->
    <button
      class="btn"
      type="primary"
      :loading="loading"
      :disabled="loading"
      @click="handleLogin"
    >
      登录
    </button>

    <!-- 错误提示 -->
    <view v-if="errMsg" class="err">{{ errMsg }}</view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: { pwd: '' },
      loading: false,
      errMsg: ''
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.pwd.trim()) {
        this.errMsg = '请输入密码'
        return
      }
      this.errMsg = ''
      this.loading = true

      try {
        const res = await uniCloud.callFunction({
          name: 'admin',
          data: {
            action: 'login',
            pwd: this.form.pwd
          }
        })

        const { code, token, msg } = res.result
        if (code === 0) {
          uni.setStorageSync('admin_token', token)
          uni.redirectTo({ url: '/pages-admin/user-list/user-list' })
        } else {
          this.errMsg = msg || '登录失败'
        }
      } catch (e) {
        this.errMsg = '网络异常，稍后重试'
        console.error(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
  background: #ffffff;
  min-height: 100vh;
}
.title {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 100rpx;
  color: #333;
}
.input {
  width: 100%;
  height: 90rpx;
  padding: 0 30rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  margin-bottom: 60rpx;
  font-size: 30rpx;
}
.btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 32rpx;
}
.err {
  margin-top: 40rpx;
  color: #fa5151;
  font-size: 28rpx;
}
</style>