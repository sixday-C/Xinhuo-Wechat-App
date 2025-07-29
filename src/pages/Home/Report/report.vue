<template>
    <view class="page-container">
        <view class="section-wrapper">
            <view class="section-title">问题图片（可选）</view>
            <view class="image-uploader">
                <view class="image-item" v-for="(image, index) in imageList" :key="index">
                    <image class="image" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
                    <view class="delete-btn" @click.stop="deleteImage(index)">
                        <text class="delete-icon">✕</text>
                    </view>
                </view>
                <view v-if="imageList.length < 3" class="upload-btn" @click="chooseImage">
                    <text class="upload-icon">+</text>
                    <text class="upload-text">添加图片</text>
                </view>
            </view>
        </view>

        <!-- 新增位置选择区域 -->
        <view class="section-wrapper">
            <view class="section-title">位置信息（可选）</view>
            <view class="location-selector" @click="chooseLocation">
                <view class="location-content">
                    <text class="location-icon">📍</text>
                    <view class="location-text-wrapper">
                        <text class="location-name">{{ selectedLocation.name || '点击选择位置' }}</text>
                        <text class="location-address">{{ selectedLocation.address || '选择位置后可在拍照时添加到图片中' }}</text>
                    </view>
                </view>
                <text class="location-arrow">></text>
            </view>
            <view v-if="selectedLocation.name" class="location-actions">
                <button class="clear-location-btn" @click.stop="clearLocation">清除位置</button>
            </view>
        </view>

        <view class="section-wrapper">
            <view class="section-title">问题描述</view>
            <textarea class="description-input" v-model="description" placeholder="请详细描述您遇到的问题，以便我们更好地为您解决..." maxlength="500"></textarea>
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
                        <text class="location-text">📍 {{ selectedLocation.name || currentLocationInfo.address }}</text>
                        <text class="coords-text">📐 {{ selectedLocation.latitude || currentLocationInfo.latitude }}, {{ selectedLocation.longitude || currentLocationInfo.longitude }}</text>
                        <text class="time-text">📅 {{ currentTime }}</text>
                        <text class="accuracy-text">📊 精度: {{ currentLocationInfo.accuracy }}米</text>
                    </view>
                </view>
                
                <!-- 重新设计的相机控制按钮 -->
                <view class="camera-controls">
                    <!-- 关闭按钮 -->
                    <view class="close-camera-btn" @click="closeCamera">
                        <view class="close-btn-circle">
                            <text class="close-btn-icon">✕</text>
                        </view>
                        <text class="close-btn-text">关闭</text>
                    </view>
                    
                    <!-- 拍照按钮 -->
                    <view class="capture-btn-wrapper" @click="takePhotoWithInfo">
                        <view class="capture-btn-outer">
                            <view class="capture-btn-inner">
                                <text class="capture-btn-icon">📷</text>
                            </view>
                        </view>
                    </view>
                    
                    <!-- 占位空间，保持布局平衡 -->
                    <view class="placeholder-btn"></view>
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
                // 选择的位置信息
                selectedLocation: {
                    name: '',
                    address: '',
                    latitude: '',
                    longitude: ''
                },
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
            // 新增：选择位置
            async chooseLocation() {
                try {
                    // 先获取当前位置作为地图中心点
                    const currentPos = await this.getCurrentLocationForMap();
                    
                    uni.chooseLocation({
                        latitude: currentPos.latitude,
                        longitude: currentPos.longitude,
                        success: (res) => {
                            console.log('位置选择成功：', res);
                            this.selectedLocation = {
                                name: res.name || res.address,
                                address: res.address,
                                latitude: res.latitude.toFixed(6),
                                longitude: res.longitude.toFixed(6)
                            };
                            
                            uni.showToast({
                                title: '位置选择成功',
                                icon: 'success'
                            });
                        },
                        fail: (err) => {
                            console.error('位置选择失败：', err);
                            if (err.errMsg && err.errMsg.includes('cancel')) {
                                return; // 用户取消，不显示错误提示
                            }
                            uni.showToast({
                                title: '位置选择失败',
                                icon: 'none'
                            });
                        }
                    });
                } catch (error) {
                    console.warn('获取当前位置失败，使用默认位置打开地图', error);
                    // 如果获取当前位置失败，直接打开位置选择器
                    uni.chooseLocation({
                        success: (res) => {
                            console.log('位置选择成功：', res);
                            this.selectedLocation = {
                                name: res.name || res.address,
                                address: res.address,
                                latitude: res.latitude.toFixed(6),
                                longitude: res.longitude.toFixed(6)
                            };
                            
                            uni.showToast({
                                title: '位置选择成功',
                                icon: 'success'
                            });
                        },
                        fail: (err) => {
                            console.error('位置选择失败：', err);
                            if (err.errMsg && err.errMsg.includes('cancel')) {
                                return;
                            }
                            uni.showToast({
                                title: '位置选择失败',
                                icon: 'none'
                            });
                        }
                    });
                }
            },

            // 新增：获取当前位置用于地图定位（不需要权限弹窗）
            async getCurrentLocationForMap() {
                return new Promise((resolve, reject) => {
                    uni.getLocation({
                        type: 'gcj02',
                        success: (res) => {
                            console.log('地图定位获取成功：', res);
                            resolve({
                                latitude: res.latitude,
                                longitude: res.longitude
                            });
                        },
                        fail: (err) => {
                            console.error('地图定位获取失败：', err);
                            reject(err);
                        }
                    });
                });
            },

            // 新增：清除位置
            clearLocation() {
                this.selectedLocation = {
                    name: '',
                    address: '',
                    latitude: '',
                    longitude: ''
                };
                uni.showToast({
                    title: '位置已清除',
                    icon: 'success'
                });
            },

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

            // 获取当前位置信息（仅用于获取坐标和精度）
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
                                address: '当前位置'
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
                                const scale = Math.min(imageInfo.width / 750, imageInfo.height / 1334);
                                const infoWidth = Math.min(imageInfo.width * 0.85, 600 * scale);
                                const infoHeight = 140 * scale;
                                const margin = 20 * scale;
                                const fontSize = Math.max(16 * scale, 12);
                                const lineHeight = Math.max(25 * scale, 18);
                                
                                // 添加半透明背景
                                ctx.setFillStyle('rgba(0, 0, 0, 0.50)');
                                ctx.fillRect(margin, margin, infoWidth, infoHeight);
                                
                                // 设置文字样式
                                ctx.setFillStyle('#FFFFFF');
                                ctx.setFontSize(fontSize);
                                ctx.setTextAlign('left');
                                
                                // 添加文字信息 - 优先使用选择的位置信息
                                const textX = margin + 15 * scale;
                                let textY = margin + 30 * scale;
                                
                                const displayAddress = this.selectedLocation.name || this.currentLocationInfo.address;
                                const displayLatitude = this.selectedLocation.latitude || this.currentLocationInfo.latitude;
                                const displayLongitude = this.selectedLocation.longitude || this.currentLocationInfo.longitude;
                                
                                ctx.fillText(`📍 ${displayAddress}`, textX, textY);
                                textY += lineHeight;
                                
                                ctx.fillText(`📐 ${displayLatitude}, ${displayLongitude}`, textX, textY);
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
                    success: async (res) => {
                        if (res.confirm) {
                            console.log('用户点击确定');
                            await this.submitReport();
                        }
                    }
                });
            },

            // 新增提交问题上报的方法
            async submitReport() {
                try {
                    uni.showLoading({ title: '正在提交...' });
        
                    // 获取用户信息
                    const userInfo = uni.getStorageSync('userInfo') || {};
        
                    // 获取当前用户ID
                    let userid = uni.getStorageSync('userid');
                    if (!userid) {
                        userid = userInfo.openid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        uni.setStorageSync('userid', userid);
                    }
        
                    // 上传图片到云存储
                    const imageUrls = await this.uploadImages();
        
                    // 调用云函数提交问题上报
                    const response = await uniCloud.callFunction({
                        name: 'add-report-demo',
                        data: {
                            userid: userid,
                            description: this.description,
                            isAnonymous: this.isAnonymous,
                            imageUrls: imageUrls,
                            userPhone: this.isAnonymous ? '' : userInfo.phone,
                            userName: this.isAnonymous ? '' : userInfo.name,
                            userAddress: this.isAnonymous ? '' : userInfo.address,
                            // 优先使用选择的位置信息
                            locationInfo: this.selectedLocation.name ? this.selectedLocation : (this.locationPermissionGranted ? this.currentLocationInfo : null),
                            reportTime: new Date().toISOString()
                        }
                    });
                    
                    uni.hideLoading();
                    
                    if (response.result.success) {
                        uni.showToast({ 
                            title: '提交成功', 
                            icon: 'success' 
                        });
                        // 清空表单
                        this.description = '';
                        this.imageList = [];
                        this.isAnonymous = false;
                        this.selectedLocation = { name: '', address: '', latitude: '', longitude: '' };
                        // 返回上一页
                        setTimeout(() => {
                            uni.navigateBack();
                        }, 1500);
                    } else {
                        uni.showToast({ 
                            title: response.result.error || '提交失败', 
                            icon: 'none' 
                        });
                    }
                } catch (error) {
                    uni.hideLoading();
                    console.error('提交失败：', error);
                    uni.showToast({ 
                        title: error.message || '提交失败，请重试', 
                        icon: 'none' 
                    });
                }
            },

            // 新增上传图片到云存储的方法
            async uploadImages() {
                if (this.imageList.length === 0) {
                    return [];
                }
                
                const uploadPromises = this.imageList.map(async (imagePath, index) => {
                    try {
                        const result = await uniCloud.uploadFile({
                            filePath: imagePath,
                            cloudPath: `report-images/${Date.now()}-${index}.jpg`,
                            cloudPathAsRealPath: true
                        });
                        return result.fileID;
                    } catch (error) {
                        console.error(`图片${index + 1}上传失败：`, error);
                        throw new Error(`图片${index + 1}上传失败`);
                    }
                });
                
                try {
                    const imageUrls = await Promise.all(uploadPromises);
                    console.log('所有图片上传成功：', imageUrls);
                    return imageUrls;
                } catch (error) {
                    throw new Error('图片上传失败，请重试');
                }
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
        border-radius: 12rpx;
        overflow: hidden;
    }

    .image {
        width: 100%;
        height: 100%;
        border-radius: 12rpx;
    }

    /* 重新设计的删除按钮 */
    .delete-btn {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        width: 32rpx;
        height: 32rpx;
        background: linear-gradient(135deg, #ff6b6b, #ff5252);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.4);
        border: 2rpx solid #ffffff;
        z-index: 10;
    }

    .delete-btn:active {
        transform: scale(0.9);
        transition: transform 0.1s ease;
    }

    .delete-icon {
        color: #ffffff;
        font-size: 18rpx;
        font-weight: bold;
        line-height: 1;
    }

    /* 重新设计的上传按钮 */
    .upload-btn {
        width: 150rpx;
        height: 150rpx;
        border: 2rpx dashed #d0d0d0;
        border-radius: 12rpx;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(145deg, #f8f9fa, #e9ecef);
        transition: all 0.3s ease;
    }

    .upload-btn:active {
        background: linear-gradient(145deg, #e9ecef, #dee2e6);
        transform: scale(0.98);
    }

    .upload-icon {
        font-size: 60rpx;
        color: #6c757d;
        margin-bottom: 8rpx;
        font-weight: 300;
    }

    .upload-text {
        font-size: 20rpx;
        color: #6c757d;
        font-weight: 500;
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

    /* 重新设计的相机控制按钮 */
    .camera-controls {
        position: absolute;
        bottom: 80rpx;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 60rpx;
        z-index: 10000;
    }

    /* 关闭按钮 */
    .close-camera-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 80rpx;
    }

    .close-btn-circle {
        width: 60rpx;
        height: 60rpx;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(10rpx);
        border: 1rpx solid rgba(255, 255, 255, 0.2);
        margin-bottom: 10rpx;
    }

    .close-btn-circle:active {
        background: rgba(0, 0, 0, 0.8);
        transform: scale(0.9);
        transition: all 0.1s ease;
    }

    .close-btn-icon {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: bold;
    }

    .close-btn-text {
        color: #ffffff;
        font-size: 22rpx;
        font-weight: 500;
    }

    /* 拍照按钮 - 调整大小 */
    .capture-btn-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .capture-btn-outer {
        width: 140rpx;
        height: 140rpx;
        border: 4rpx solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10rpx);
    }

    .capture-btn-outer:active {
        transform: scale(0.95);
        border-color: rgba(255, 255, 255, 1);
        transition: all 0.1s ease;
    }

    .capture-btn-inner {
        width: 120rpx;
        height: 120rpx;
        background: linear-gradient(135deg, #007AFF, #0056d6);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.4);
    }

    .capture-btn-icon {
        color: #ffffff;
        font-size: 42rpx;
    }

    /* 占位按钮，保持布局平衡 */
    .placeholder-btn {
        width: 80rpx;
        height: 60rpx;
    }

    /* 隐藏的Canvas */
    .hidden-canvas {
        position: fixed;
        top: -9999px;
        left: -9999px;
        z-index: -1;
    }

    /* 新增位置选择相关样式 */
    .location-selector {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20rpx;
        background-color: #f9f9f9;
        border-radius: 10rpx;
        border: 1rpx solid #e0e0e0;
        margin-bottom: 10rpx;
    }

    .location-content {
        display: flex;
        align-items: center;
        flex: 1;
    }

    .location-icon {
        font-size: 32rpx;
        margin-right: 15rpx;
    }

    .location-text-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .location-name {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 5rpx;
    }

    .location-address {
        font-size: 24rpx;
        color: #999;
        line-height: 1.4;
    }

    .location-arrow {
        font-size: 28rpx;
        color: #ccc;
        font-weight: bold;
    }

    .location-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10rpx;
    }

    .clear-location-btn {
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 20rpx;
        padding: 10rpx 20rpx;
        font-size: 24rpx;
    }
</style>