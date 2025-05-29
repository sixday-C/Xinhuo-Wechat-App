<template>
  <view class="container">
    <!-- 定位信息 -->
    <view class="location-card">
      <text class="location-icon">📍</text>
      <view class="location-content">
        <text class="location-title">当前位置</text>
        <text class="location-info">{{ locationInfo }}</text>
      </view>
    </view>

    <!-- 问题反馈表单 -->
    <view class="form-container">
      <!-- 图片上传 -->
      <view class="form-item">
        <view class="item-label">问题照片</view>
        <view class="upload-area" @click="handleTakePhoto">
          <image v-if="imageList.length > 0" 
                 class="preview-image" 
                 :src="imageList[0]" 
                 mode="aspectFill"/>
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">拍照或上传图片</text>
          </view>
        </view>
        <view class="image-preview" v-if="imageList.length > 1">
          <image v-for="(img, index) in imageList.slice(0,3)" 
                 :key="index" 
                 :src="img" 
                 mode="aspectFill"
                 class="preview-item"
                 @click="previewImage(index)"/>
        </view>
      </view>

      <!-- 文字反馈 -->
      <view class="form-item">
        <view class="item-label">问题描述</view>
        <textarea class="text-input" 
                  v-model="textContent" 
                  placeholder="请详细描述您遇到的问题（最多200字）"
                  maxlength="200"
                  @input="handleTextChange"/>
        <view class="text-counter">{{ textCount }}/200</view>
      </view>

      <!-- 语音输入 -->
      <view class="form-item">
        <view class="item-label">语音输入</view>
        <view class="voice-control">
          <button class="voice-btn" @click="handleVoiceInput">
            <text class="voice-icon">🎤</text>
            <text class="voice-text">{{ isRecording ? '松开结束' : '按住说话' }}</text>
          </button>
        </view>
        <view class="voice-result">
          <text class="voice-tip">语音转文字结果将显示在此处</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submitForm">
      <text class="submit-text">提交反馈</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 定位信息（模拟数据）
const locationInfo = ref('XX小区 3号楼 1单元')

// 图片相关
const imageList = ref([])
const MAX_IMAGES = 3

// 文本输入
const textContent = ref('')
const textCount = ref(0)

// 语音输入
const isRecording = ref(false)

// 处理拍照
const handleTakePhoto = () => {
  uni.chooseImage({
    count: MAX_IMAGES - imageList.value.length,
    sourceType: ['camera', 'album'],
    success: (res) => {
      imageList.value = [...imageList.value, ...res.tempFilePaths]
    }
  })
}

// 处理文字输入
const handleTextChange = (e) => {
  textContent.value = e.detail.value
  textCount.value = e.detail.value.length
}

// 处理语音输入（模拟）
const handleVoiceInput = () => {
  // 实际开发需要接入录音API
}

// 提交表单
const submitForm = () => {
  // 表单验证和提交逻辑
  console.log('提交内容：', {
    location: locationInfo.value,
    images: imageList.value,
    content: textContent.value
  })
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: imageList.value,
    current: index
  })
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 定位卡片样式 */
.location-card {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.location-icon {
  font-size: 50rpx;
  color: #007AFF;
  margin-right: 20rpx;
}

.location-content {
  flex: 1;
}

.location-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.location-info {
  color: #666;
  font-size: 28rpx;
}

/* 表单样式 */
.form-container {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.item-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

/* 图片上传 */
.upload-area {
  border: 2rpx dashed #ccc;
  border-radius: 12rpx;
  padding: 40rpx 0;
  text-align: center;
  position: relative;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 60rpx;
  color: #ddd;
}

.upload-text {
  color: #999;
  margin-top: 10rpx;
}

.preview-image {
  width: 100%;
  height: 300rpx;
  border-radius: 8rpx;
}

.image-preview {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.preview-item {
  width: 150rpx;
  height: 150rpx;
  border-radius: 8rpx;
  object-fit: cover;
}

/* 文本输入 */
.text-input {
  width: 100%;
  height: 200rpx;
  padding: 20rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.text-counter {
  text-align: right;
  color: #999;
  font-size: 24rpx;
  margin-top: 10rpx;
}

/* 语音输入 */
.voice-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.voice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 80rpx;
  background: linear-gradient(90deg, #007AFF, #00C6FF);
  color: white;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.voice-icon {
  margin-right: 10rpx;
}

.voice-result {
  margin-top: 16rpx;
  color: #666;
  font-size: 24rpx;
}

/* 提交按钮 */
.submit-btn {
  margin-top: 40rpx;
  background: linear-gradient(90deg, #007AFF, #00C6FF);
  color: white;
  text-align: center;
  padding: 30rpx 0;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-text {
  display: block;
}
</style>