<template>
  <view class="container">
    <!-- 左侧导航 -->
    <view class="sidebar">
      <view
        v-for="btn in buttons"
        :key="btn.key"
        class="nav-btn"
        @click="navigate(btn.key)"
      >
        {{ btn.label }}
      </view>
    </view>

    <!-- 右侧内容入口 -->
    <view class="main-content">
      <text>请选择左侧功能进行操作</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      buttons: [
        { key: 'user-list', label: '用户管理' },
        
        { key: 'feedback-list', label: '问题反馈' },
        { key: 'booking-list', label: '预约查询' }
      ]
    }
  },
  methods: {
    navigate(pageKey) {
      uni.navigateTo({ url: `/pages-admin/${pageKey}/${pageKey}` });
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
}
.nav-btn {
  padding: 16px;
  margin: 8px 12px;
  background-color: #409eff;
  color: #fff;
  text-align: center;
  border-radius: 4px;
  font-size: 14px;
}
.nav-btn:hover {
  background-color: #66b1ff;
}
.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: #666;
}
</style>
