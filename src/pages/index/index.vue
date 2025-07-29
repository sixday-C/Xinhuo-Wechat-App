<template>
  <view class="splash-container">
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">领里芯声</text>
      <text class="app-desc">社区服务，便民利民</text>
    </view>
    
    <view class="loading-section">
      <view class="loading-dots">
        <view class="dot" :class="{ active: loadingDot === 0 }"></view>
        <view class="dot" :class="{ active: loadingDot === 1 }"></view>
        <view class="dot" :class="{ active: loadingDot === 2 }"></view>
      </view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
  </view>
</template>

<script>
import UserManager from '@/utils/userManager.js'

export default {
  data() {
    return {
      loadingDot: 0,
      loadingText: '正在启动...'
    }
  },
  
  onLoad() {
    this.startLoadingAnimation();
    this.checkLoginStatus();
  },
  
  methods: {
    // 启动加载动画
    startLoadingAnimation() {
      this.loadingInterval = setInterval(() => {
        this.loadingDot = (this.loadingDot + 1) % 3;
      }, 500);
    },
    
    // 停止加载动画
    stopLoadingAnimation() {
      if (this.loadingInterval) {
        clearInterval(this.loadingInterval);
      }
    },
    
    // 检查登录状态
    async checkLoginStatus() {
      try {
        this.loadingText = '检查登录状态...';
        
        // 模拟加载时间，让用户看到启动页
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const isLoggedIn = UserManager.isLoggedIn();
        const userInfo = UserManager.getCurrentUser();
        
        if (isLoggedIn && userInfo) {
          this.loadingText = '登录成功，正在跳转...';
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 已登录，跳转到主页
          uni.switchTab({
            url: '/pages/Home/home'
          });
        } else {
          this.loadingText = '需要登录，正在跳转...';
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 未登录，跳转到登录页
          uni.reLaunch({
            url: '/pages/Login/Login'
          });
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        this.loadingText = '启动失败，正在重试...';
        
        // 3秒后重试或跳转到登录页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/Login/Login'
          });
        }, 3000);
      } finally {
        this.stopLoadingAnimation();
      }
    }
  },
  
  onUnload() {
    this.stopLoadingAnimation();
  }
}
</script>

<style>
.splash-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
}

.logo-section {
  text-align: center;
  margin-bottom: 100rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.loading-section {
  text-align: center;
}

.loading-dots {
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 8rpx;
  transition: all 0.3s ease;
}

.dot.active {
  background: #fff;
  transform: scale(1.2);
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}
</style>
