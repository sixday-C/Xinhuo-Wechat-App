<template>
    <view class="page-container">
        <view class="section-wrapper">
            <view class="section-title">问题图片（可选）</view>
            <view class="image-uploader">
                <view class="image-item" v-for="(image, index) in imageList" :key="index">
                    <image class="image" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
                    <view class="close-icon" @click.stop="deleteImage(index)">×</view>
                </view>
                <view v-if="imageList.length < 3" class="upload-btn" @click="chooseImage">+</view>
            </view>
        </view>

        <view class="section-wrapper">
            <view class="section-title">问题描述</view>
            <textarea class="description-input" v-model="description" placeholder="请详细描述您遇到的问题，以便我们更好地为您解决..." maxlength="500"></textarea>
        </view>

        <view class="section-wrapper anonymous-section">
            <text class="anonymous-text">匿名上报</text>
            <switch :checked="isAnonymous" @change="handleSwitchChange" color="#007AFF" />
        </view>

        <button class="submit-btn" @click="handleSubmit">提 交</button>
        
        <!-- 自定义相机界面 -->
        <view v-if="showCamera" class="camera-container">
            <camera 
                device-position="back" 
                flash="off" 
                @error="onCameraError"
                class="camera">
                
                <!-- 位置信息覆盖层 -->
                <view class="camera-info-overlay">
                    <view class="info-text">
                        <text class="location-text">📍 {{ currentLocationInfo.address }}</text>
                        <text class="coords-text">📐 {{ currentLocationInfo.latitude }}, {{ currentLocationInfo.longitude }}</text>
                        <text class="time-text">📅 {{ currentTime }}</text>
                        <text class="accuracy-text">📊 精度: {{ currentLocationInfo.accuracy }}米</text>
                    </view>
                </view>
                
                <!-- 相机控制按钮 -->
                <view class="camera-controls">
                    <view class="control-btn close-btn" @click="closeCamera">
                        <text>关闭</text>
                    </view>
                    <view class="control-btn capture-btn" @click="takePhotoWithInfo">
                        <text>拍照</text>
                    </view>
                </view>
            </camera>
        </view>
        
        <!-- 隐藏的Canvas用于图片合成 -->
        <canvas 
            canvas-id="photoCanvas" 
            class="hidden-canvas"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        </canvas>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                imageList: [],
                description: '',
                isAnonymous: false,
                showCamera: false,
                currentLocationInfo: {
                    latitude: '获取中...',
                    longitude: '获取中...',
                    address: '正在获取位置...',
                    accuracy: 0
                },
                currentTime: '',
                locationTimer: null,
                timeTimer: null,
                canvasWidth: 375,
                canvasHeight: 667,
                locationPermissionGranted: false
            };
        },
        methods: {
            // 请求位置权限
            async requestLocationPermission() {
                return new Promise((resolve) => {
                    uni.showModal({
                        title: '位置权限申请',
                        content: '为了在拍照时添加位置信息到图片中，我们需要获取您的位置权限。这些信息仅用于标记问题发生的地点，不会用于其他用途。',
                        confirmText: '同意',
                        cancelText: '拒绝',
                        success: (res) => {
                            if (res.confirm) {
                                this.locationPermissionGranted = true;
                                resolve(true);
                            } else {
                                this.locationPermissionGranted = false;
                                uni.showToast({
                                    title: '已拒绝位置权限，将无法添加位置信息',
                                    icon: 'none',
                                    duration: 3000
                                });
                                resolve(false);
                            }
                        }
                    });
                });
            },

            // 获取当前位置信息
            async getCurrentLocation() {
                return new Promise((resolve, reject) => {
                    if (!this.locationPermissionGranted) {
                        reject(new Error('用户未授权位置权限'));
                        return;
                    }

                    console.log('开始获取位置信息...');
                    
                    uni.getLocation({
                        type: 'gcj02',
                        altitude: true,
                        isHighAccuracy: true,
                        highAccuracyExpireTime: 4000,
                        success: (res) => {
                            console.log('位置获取成功：', res);
                            resolve({
                                latitude: res.latitude.toFixed(6),
                                longitude: res.longitude.toFixed(6),
                                altitude: res.altitude || 0,
                                accuracy: Math.round(res.accuracy) || 0,
                                address: res.address || `经度${res.latitude.toFixed(4)} 纬度${res.longitude.toFixed(4)}`
                            });
                        },
                        fail: (err) => {
                            console.error('获取位置失败：', err);
                            
                            // 如果是权限问题，提示用户手动开启
                            if (err.errMsg && err.errMsg.includes('auth')) {
                                uni.showModal({
                                    title: '位置权限被拒绝',
                                    content: '请在系统设置中开启位置权限后重试',
                                    confirmText: '去设置',
                                    cancelText: '取消',
                                    success: (modalRes) => {
                                        if (modalRes.confirm) {
                                            uni.openSetting();
                                        }
                                    }
                                });
                            }
                            
                            reject(new Error('位置获取失败'));
                        }
                    });
                });
            },

            // 更新位置信息
            async updateLocationInfo() {
                try {
                    const location = await this.getCurrentLocation();
                    this.currentLocationInfo = location;
                    console.log('位置信息已更新：', this.currentLocationInfo);
                } catch (error) {
                    console.error('位置更新失败：', error);
                    this.currentLocationInfo = {
                        latitude: '获取失败',
                        longitude: '获取失败',
                        address: '位置获取失败',
                        accuracy: 0
                    };
                }
            },

            // 更新时间
            updateTime() {
                const now = new Date();
                this.currentTime = now.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
            },

            // 开启相机
            async openCustomCamera() {
                console.log('开启相机...');
                
                // 首先请求位置权限
                const permissionGranted = await this.requestLocationPermission();
                
                // 显示相机界面
                this.showCamera = true;
                
                // 立即更新时间
                this.updateTime();
                
                // 如果授权了位置权限，获取位置信息
                if (permissionGranted) {
                    await this.updateLocationInfo();
                    
                    // 设置定时器定期更新位置
                    this.locationTimer = setInterval(() => {
                        this.updateLocationInfo();
                    }, 10000); // 每10秒更新一次位置
                }
                
                // 设置定时器更新时间
                this.timeTimer = setInterval(() => {
                    this.updateTime();
                }, 1000); // 每秒更新时间
            },

            // 关闭相机
            closeCamera() {
                this.showCamera = false;
                
                // 清除定时器
                if (this.locationTimer) {
                    clearInterval(this.locationTimer);
                    this.locationTimer = null;
                }
                if (this.timeTimer) {
                    clearInterval(this.timeTimer);
                    this.timeTimer = null;
                }
            },

            // 使用Canvas在图片上添加信息
            async addInfoToImage(imagePath) {
                return new Promise((resolve, reject) => {
                    console.log('开始处理图片：', imagePath);
                    
                    uni.getImageInfo({
                        src: imagePath,
                        success: (imageInfo) => {
                            console.log('原图片信息：', imageInfo);
                            
                            // 设置Canvas尺寸与图片相同
                            this.canvasWidth = imageInfo.width;
                            this.canvasHeight = imageInfo.height;
                            
                            // 等待下一帧确保Canvas尺寸更新
                            this.$nextTick(() => {
                                const ctx = uni.createCanvasContext('photoCanvas', this);
                                
                                // 绘制原图片
                                ctx.drawImage(imagePath, 0, 0, imageInfo.width, imageInfo.height);
                                
                                // 计算信息框尺寸 - 根据图片尺寸调整
                                const scale = Math.min(imageInfo.width / 750, imageInfo.height / 1334); // 以iPhone 6/7/8为基准
                                const infoWidth = Math.min(imageInfo.width * 0.85, 600 * scale);
                                const infoHeight = 140 * scale;
                                const margin = 20 * scale;
                                const fontSize = Math.max(16 * scale, 12); // 最小字体12px
                                const lineHeight = Math.max(25 * scale, 18); // 最小行高18px
                                
                                // 添加半透明背景
                                ctx.setFillStyle('rgba(0, 0, 0, 0.50)');
                                ctx.fillRect(margin, margin, infoWidth, infoHeight);
                                
                                // 设置文字样式
                                ctx.setFillStyle('#FFFFFF');
                                ctx.setFontSize(fontSize);
                                ctx.setTextAlign('left');
                                
                                // 添加文字信息
                                const textX = margin + 15 * scale;
                                let textY = margin + 30 * scale;
                                
                                ctx.fillText(`📍 ${this.currentLocationInfo.address}`, textX, textY);
                                textY += lineHeight;
                                
                                ctx.fillText(`📐 ${this.currentLocationInfo.latitude}, ${this.currentLocationInfo.longitude}`, textX, textY);
                                textY += lineHeight;
                                
                                ctx.fillText(`📅 ${this.currentTime}`, textX, textY);
                                textY += lineHeight;
                                
                                ctx.fillText(`📊 精度: ${this.currentLocationInfo.accuracy}米`, textX, textY);
                                
                                // 执行绘制
                                ctx.draw(false, () => {
                                    // 延迟确保绘制完成
                                    setTimeout(() => {
                                        uni.canvasToTempFilePath({
                                            canvasId: 'photoCanvas',
                                            x: 0,
                                            y: 0,
                                            width: imageInfo.width,
                                            height: imageInfo.height,
                                            destWidth: imageInfo.width,
                                            destHeight: imageInfo.height,
                                            quality: 0.9,
                                            fileType: 'jpg',
                                            success: (res) => {
                                                console.log('图片合成成功：', res.tempFilePath);
                                                resolve(res.tempFilePath);
                                            },
                                            fail: (err) => {
                                                console.error('Canvas导出失败：', err);
                                                reject(err);
                                            }
                                        }, this);
                                    }, 300);
                                });
                            });
                        },
                        fail: (err) => {
                            console.error('获取图片信息失败：', err);
                            reject(err);
                        }
                    });
                });
            },

            // 使用相机拍照
            async takePhotoWithInfo() {
                console.log('开始拍照...');
                
                const ctx = uni.createCameraContext();
                ctx.takePhoto({
                    quality: 'high',
                    success: async (res) => {
                        console.log('拍照成功：', res.tempImagePath);
                        
                        uni.showLoading({
                            title: '处理中...'
                        });
                        
                        try {
                            // 如果有位置权限，添加信息到图片
                            if (this.locationPermissionGranted) {
                                const processedImage = await this.addInfoToImage(res.tempImagePath);
                                this.imageList = [...this.imageList, processedImage];
                            } else {
                                // 没有位置权限时直接使用原图
                                this.imageList = [...this.imageList, res.tempImagePath];
                            }
                            
                            uni.hideLoading();
                            this.closeCamera();
                            uni.showToast({
                                title: '拍照成功',
                                icon: 'success'
                            });
                        } catch (error) {
                            console.error('图片处理失败：', error);
                            uni.hideLoading();
                            // 处理失败时使用原图
                            this.imageList = [...this.imageList, res.tempImagePath];
                            this.closeCamera();
                            uni.showToast({
                                title: '拍照成功',
                                icon: 'success'
                            });
                        }
                    },
                    fail: (err) => {
                        console.error('拍照失败：', err);
                        uni.showToast({
                            title: '拍照失败',
                            icon: 'none'
                        });
                    }
                });
            },

            // 相机错误处理
            onCameraError(error) {
                console.error('相机错误：', error);
                uni.showToast({
                    title: '相机启动失败',
                    icon: 'none'
                });
                this.closeCamera();
            },

            // 选择图片
            chooseImage() {
                uni.showActionSheet({
                    itemList: ['拍照', '从相册选择'],
                    success: (res) => {
                        if (res.tapIndex === 0) {
                            this.openCustomCamera();
                        } else if (res.tapIndex === 1) {
                            this.chooseFromAlbum();
                        }
                    }
                });
            },

            // 从相册选择
            chooseFromAlbum() {
                uni.chooseImage({
                    count: 3 - this.imageList.length,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album'],
                    success: (res) => {
                        this.imageList = [...this.imageList, ...res.tempFilePaths];
                    }
                });
            },

            previewImage(currentIndex) {
                uni.previewImage({
                    current: currentIndex,
                    urls: this.imageList
                });
            },

            deleteImage(deleteIndex) {
                this.imageList.splice(deleteIndex, 1);
            },

            handleSwitchChange(e) {
                this.isAnonymous = e.detail.value;
            },

            handleSubmit() {
                if (!this.description) {
                    uni.showToast({
                        title: '问题描述不能为空',
                        icon: 'none'
                    });
                    return;
                }
                
                uni.showModal({
                    title: '提交内容确认',
                    content: `问题描述: ${this.description}\n匿名状态: ${this.isAnonymous ? '是' : '否'}\n图片数量: ${this.imageList.length}张`,
                    success: (res) => {
                        if (res.confirm) {
                            console.log('用户点击确定');
                            uni.showLoading({ title: '正在提交...'})
                            setTimeout(() => {
                                uni.hideLoading();
                                uni.showToast({ title: '提交成功' });
                                uni.navigateBack();
                            }, 1500);
                        }
                    }
                });
            }
        },
        
        beforeDestroy() {
            if (this.locationTimer) {
                clearInterval(this.locationTimer);
            }
            if (this.timeTimer) {
                clearInterval(this.timeTimer);
            }
        }
    }
</script>

<style>
    .page-container {
        background-color: #f8f8f8;
        min-height: 100vh;
        padding: 20rpx;
        box-sizing: border-box;
    }

    .section-wrapper {
        background-color: #ffffff;
        padding: 25rpx;
        border-radius: 16rpx;
        margin-bottom: 25rpx;
    }

    .section-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .image-uploader {
        display: flex;
        flex-wrap: wrap;
    }

    .image-item {
        position: relative;
        width: 150rpx;
        height: 150rpx;
        margin-right: 20rpx;
        margin-bottom: 20rpx;
    }

    .image {
        width: 100%;
        height: 100%;
        border-radius: 10rpx;
    }

    .close-icon {
        position: absolute;
        top: -10rpx;
        right: -10rpx;
        width: 36rpx;
        height: 36rpx;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24rpx;
        line-height: 36rpx;
    }

    .upload-btn {
        width: 150rpx;
        height: 150rpx;
        border: 2rpx dashed #ccc;
        border-radius: 10rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 60rpx;
        color: #ccc;
        background-color: #fafafa;
    }

    .description-input {
        width: 100%;
        height: 250rpx;
        font-size: 28rpx;
        line-height: 1.5;
        box-sizing: border-box;
    }

    .anonymous-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .anonymous-text {
        font-size: 30rpx;
        color: #333;
    }

    .submit-btn {
        background-color: #007aff;
        color: white;
        border-radius: 50rpx;
        font-size: 32rpx;
        margin-top: 20rpx;
    }

    .submit-btn:active {
        background-color: #0056b3;
    }

    /* 相机相关样式 */
    .camera-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background-color: #000;
    }

    .camera {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .camera-info-overlay {
        position: absolute;
        top: 40rpx;
        left: 20rpx;
        z-index: 10000;
        background-color: rgba(0, 0, 0, 0.8);
        padding: 20rpx;
        border-radius: 10rpx;
        max-width: 500rpx;
    }

    .info-text {
        display: flex;
        flex-direction: column;
    }

    .location-text,
    .coords-text,
    .time-text,
    .accuracy-text {
        color: #FFFFFF;
        font-size: 24rpx;
        line-height: 1.6;
        margin-bottom: 5rpx;
    }

    .camera-controls {
        position: absolute;
        bottom: 100rpx;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 10000;
    }

    .control-btn {
        padding: 20rpx 40rpx;
        border-radius: 50rpx;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .close-btn {
        background-color: rgba(255, 255, 255, 0.3);
        color: #FFFFFF;
    }

    .capture-btn {
        background-color: #007AFF;
        color: #FFFFFF;
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
    }

    .control-btn text {
        font-size: 28rpx;
        font-weight: bold;
    }

    /* 隐藏的Canvas */
    .hidden-canvas {
        position: fixed;
        top: -9999px;
        left: -9999px;
        z-index: -1;
    }
</style>