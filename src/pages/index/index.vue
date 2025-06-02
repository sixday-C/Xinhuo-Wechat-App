<template>
  <view class="container">
    <!-- 定位信息 -->
    <view class="location-card" @click="chooseLocation">
      <text class="location-icon">📍</text>
      <view class="location-content">
        <text class="location-title">当前位置</text>
        <text class="location-info">{{ locationInfo }}</text>
      </view>
      <text class="location-action">></text>
    </view>

    <!-- 问题反馈表单 -->
    <view class="form-container">
      <!-- 图片上传 -->
      <view class="form-item">
        <view class="item-label">问题照片</view>
        <view class="upload-area" @click="handleTakePhoto">
          <image v-if="imageList.length > 0" class="preview-image" :src="imageList[0]" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">拍照或上传图片</text>
          </view>
        </view>
        <view class="image-preview" v-if="imageList.length > 0">
          <view v-for="(img, index) in imageList" :key="index" class="preview-item-wrapper">
            <image :src="img" mode="aspectFill" class="preview-item" @click="previewImage(index)" />
            <view class="delete-btn" @click.stop="removeImage(index)">×</view>
          </view>
        </view>
      </view>

      <!-- 文字反馈 -->
      <view class="form-item">
        <view class="item-label">问题描述</view>
        <textarea class="text-input" v-model="textContent" placeholder="请详细描述您遇到的问题（最多200字）" maxlength="200"
          @input="handleTextChange" />
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
          <text class="voice-tip" v-if="!voiceText">语音转文字结果将显示在此处</text>
          <text v-else>{{ voiceText }}</text>
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

// 定位信息
const locationInfo = ref('点击选择位置')
const latitude = ref('')
const longitude = ref('')

// 图片相关
const imageList = ref([])
const MAX_IMAGES = 9

// 删除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
}

// 文本输入
const textContent = ref('')
const textCount = ref(0)

// 语音输入
const isRecording = ref(false)
const voiceText = ref('') // 语音识别结果
let recorderManager = null
let voiceId = ''

// 获取 access_token 的方法（建议后端提供，这里仅作占位）
const getAccessToken = async () => {
  // TODO: 替换为你的 access_token 获取逻辑
  return '你的access_token'
}

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

// 处理语音输入
const handleVoiceInput = async () => {
  if (!recorderManager) {
    recorderManager = uni.getRecorderManager()
    recorderManager.onStop(async (res) => {
      isRecording.value = false
      await uploadVoice(res.tempFilePath)
    })
    recorderManager.onError((err) => {
      isRecording.value = false
      uni.showToast({ title: '录音失败', icon: 'none' })
    })
  }
  if (!isRecording.value) {
    isRecording.value = true
    voiceText.value = ''
    recorderManager.start({
      format: 'mp3',
      duration: 60000, // 最长60秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000
    })
    uni.showToast({ title: '正在录音，松开发送', icon: 'none' })
  } else {
    recorderManager.stop()
  }
}

// 上传录音并获取识别结果（仅支持mp3格式）
async function uploadVoice(filePath) {
  const accessToken = await getAccessToken()
  voiceId = String(Date.now())
  uni.uploadFile({
    url: `https://api.weixin.qq.com/cgi-bin/media/voice/addvoicetorecofortext?access_token=${accessToken}&format=mp3&voice_id=${voiceId}&lang=zh_CN`,
    filePath,
    name: 'media',
    success: async (uploadRes) => {
      let data = {}
      try {
        data = JSON.parse(uploadRes.data)
      } catch (e) {
        data = uploadRes.data
      }
      if (data.errcode === 0 || data.errmsg === 'ok') {
        setTimeout(() => {
          getVoiceResult()
        }, 2000)
      } else {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
    fail: () => {
      uni.showToast({ title: '上传失败', icon: 'none' })
    }
  })
}


async function getVoiceResult() {
  const accessToken = await getAccessToken()
  uni.request({
    url: `https://api.weixin.qq.com/cgi-bin/media/voice/queryrecoresultfortext?access_token=${accessToken}&voice_id=${voiceId}&lang=zh_CN`,
    method: 'POST',
    success: (res) => {
      if (res.data && res.data.result) {
        voiceText.value = res.data.result
      } else {
        voiceText.value = '识别失败'
      }
    },
    fail: () => {
      voiceText.value = '识别失败'
    }
  })
}

// 选择位置
const chooseLocation = () => {
  uni.chooseLocation({
    success: (res) => {
      console.log('位置信息：', res)
      locationInfo.value = res.name || res.address || '未知位置'
      latitude.value = res.latitude
      longitude.value = res.longitude
      
      // 可以将详细地址保存
      if (res.address) {
        locationInfo.value = res.address
      }
    },
    fail: (err) => {
      console.error('选择位置失败：', err)
      uni.showToast({
        title: '获取位置失败，请检查定位权限',
        icon: 'none',
        duration: 2000
      })
    }
  })
}

// 提交表单
const submitForm = () => {
  // 表单验证
  if (!latitude.value || !longitude.value) {
    uni.showToast({
      title: '请先选择位置',
      icon: 'none'
    })
    return
  }
  
  if (!textContent.value && imageList.value.length === 0) {
    uni.showToast({
      title: '请至少输入问题描述或上传图片',
      icon: 'none'
    })
    return
  }
  
  // 表单验证和提交逻辑
  console.log('提交内容：', {
    location: locationInfo.value,
    latitude: latitude.value,
    longitude: longitude.value,
    images: imageList.value,
    content: textContent.value
  })
  
  uni.showToast({
    title: '提交成功',
    icon: 'success'
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
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-card:active {
  transform: scale(0.98);
  background-color: #f8f9fa;
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

.location-action {
  color: #999;
  font-size: 32rpx;
  margin-left: 20rpx;
}

/* 表单样式 */
.form-container {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
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
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.preview-item-wrapper {
  position: relative;
  width: calc((100% - 32rpx) / 3);
  /* 3列，2个gap */
  margin-bottom: 16rpx;
  display: inline-block;
}

.preview-item {
  width: 100%;
  height: 150rpx;
  border-radius: 8rpx;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 36rpx;
  font-size: 28rpx;
  z-index: 2;
  cursor: pointer;
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
</style>