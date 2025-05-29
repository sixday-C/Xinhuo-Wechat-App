

<template>
  <view class="container">
    <!-- 姓名输入 -->
    <view class="input-item">
      <label class="label">姓名：</label>
      <input 
        class="input"
        v-model="name"
        placeholder="请输入真实姓名"
        @input="validateName"
        maxlength="10"
      />
    </view>

    <!-- 联系方式输入 -->
    <view class="input-item">
      <label class="label">联系方式：</label>
      <input 
        class="input"
        v-model="contact"
        placeholder="请输入手机号码"
        type="number"
        @input="validateContact"
        maxlength="11"
      />
    </view>

    <!-- 具体住址输入 -->
    <view class="input-item">
      <label class="label">具体住址：</label>
      <input 
        class="input"
        v-model="address"
        placeholder="例如：3-502（楼号-门牌号）"
        @input="validateAddress"
        maxlength="20"
      />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 响应式数据
const name = ref('')
const contact = ref('')
const address = ref('')

// 姓名验证（仅汉字）
const validateName = (e) => {
  name.value = e.detail.value.replace(/[^\u4e00-\u9fa5]/g, '')
}

// 联系方式验证（仅数字）
const validateContact = (e) => {
  contact.value = e.detail.value.replace(/\D/g, '')
}

// 地址验证（允许数字和连字符）
const validateAddress = (e) => {
  address.value = e.detail.value.replace(/[^\d-]/g, '')
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.input-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin: 20rpx 0;
  background-color: #fff;
  border-radius: 12rpx;
}

.label {
  width: 160rpx;
  font-size: 28rpx;
  color: #333;
}

.input {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  padding: 10rpx 0;
}

/* 去除input默认样式 */
input {
  border: none;
  outline: none;
  background: transparent;
}

/* 去除uniapp input的默认下划线 */
/deep/.uni-input-input {
  border: none !important;
}
</style>