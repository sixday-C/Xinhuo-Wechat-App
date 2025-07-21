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
        
        <!-- 隐藏的canvas用于图片合成 -->
        <canvas canvas-id="imageCanvas" style="position: fixed; top: -9999px; left: -9999px; width: 300px; height: 300px;"></canvas>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                imageList: [],
                description: '',
                isAnonymous: false,
                currentLocation: null
            };
        },
        methods: {
            // 获取当前位置信息
            async getCurrentLocation() {
                return new Promise((resolve, reject) => {
                    uni.getLocation({
                        type: 'gcj02',
                        geocode: true,
                        success: (res) => {
                            console.log('位置信息：', res);
                            resolve({
                                latitude: res.latitude,
                                longitude: res.longitude,
                                address: res.address || '位置获取中...',
                                speed: res.speed,
                                accuracy: res.accuracy
                            });
                        },
                        fail: (err) => {
                            console.error('获取位置失败：', err);
                            reject(err);
                        }
                    });
                });
            },

            // 获取详细地址信息
            async getAddressFromCoords(latitude, longitude) {
                return new Promise((resolve) => {
                    // 使用腾讯地图逆地址解析API或其他地图服务
                    // 这里使用模拟数据，实际开发中需要调用真实的地图API
                    const mockAddress = `纬度: ${latitude.toFixed(6)}\n经度: ${longitude.toFixed(6)}`;
                    resolve(mockAddress);
                });
            },

            // 在图片上添加位置和时间信息
            async addInfoToImage(imagePath) {
                return new Promise(async (resolve, reject) => {
                    try {
                        // 获取当前位置
                        const location = await this.getCurrentLocation();
                        
                        // 获取当前时间
                        const now = new Date();
                        const dateStr = now.toLocaleDateString('zh-CN');
                        const timeStr = now.toLocaleTimeString('zh-CN');
                        
                        // 格式化位置信息
                        const locationText = `📍 ${location.address || '未知位置'}\n📐 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n📅 ${dateStr} ${timeStr}`;
                        
                        // 创建canvas上下文
                        const ctx = uni.createCanvasContext('imageCanvas', this);
                        
                        // 获取图片信息
                        uni.getImageInfo({
                            src: imagePath,
                            success: (imgInfo) => {
                                const canvasWidth = imgInfo.width;
                                const canvasHeight = imgInfo.height;
                                
                                // 设置canvas尺寸
                                ctx.canvas.width = canvasWidth;
                                ctx.canvas.height = canvasHeight;
                                
                                // 绘制原图
                                ctx.drawImage(imagePath, 0, 0, canvasWidth, canvasHeight);
                                
                                // 绘制信息背景
                                const padding = 20;
                                const bgHeight = 120;
                                const bgWidth = 400;
                                
                                // 半透明黑色背景
                                ctx.setFillStyle('rgba(0, 0, 0, 0.7)');
                                ctx.fillRect(padding, padding, bgWidth, bgHeight);
                                
                                // 设置文字样式
                                ctx.setFillStyle('#FFFFFF');
                                ctx.setFontSize(24);
                                ctx.setTextAlign('left');
                                
                                // 绘制位置信息
                                const lines = locationText.split('\n');
                                lines.forEach((line, index) => {
                                    ctx.fillText(line, padding + 15, padding + 35 + (index * 30));
                                });
                                
                                // 保存合成后的图片
                                ctx.draw(false, () => {
                                    setTimeout(() => {
                                        uni.canvasToTempFilePath({
                                            canvasId: 'imageCanvas',
                                            success: (res) => {
                                                console.log('图片合成成功：', res.tempFilePath);
                                                resolve(res.tempFilePath);
                                            },
                                            fail: (err) => {
                                                console.error('图片合成失败：', err);
                                                reject(err);
                                            }
                                        }, this);
                                    }, 500);
                                });
                            },
                            fail: (err) => {
                                console.error('获取图片信息失败：', err);
                                reject(err);
                            }
                        });
                    } catch (error) {
                        console.error('添加信息到图片失败：', error);
                        reject(error);
                    }
                });
            },

            // 选择图片
            chooseImage() {
                uni.showActionSheet({
                    itemList: ['拍照', '从相册选择'],
                    success: (res) => {
                        if (res.tapIndex === 0) {
                            // 拍照
                            this.takePhoto();
                        } else if (res.tapIndex === 1) {
                            // 从相册选择
                            this.chooseFromAlbum();
                        }
                    }
                });
            },

            // 拍照功能
            takePhoto() {
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original'],
                    sourceType: ['camera'],
                    success: async (res) => {
                        const tempFilePath = res.tempFilePaths[0];
                        
                        try {
                            uni.showLoading({ title: '正在处理图片...' });
                            
                            // 在图片上添加位置和时间信息
                            const processedImagePath = await this.addInfoToImage(tempFilePath);
                            
                            // 添加到图片列表
                            this.imageList = [...this.imageList, processedImagePath];
                            
                            uni.hideLoading();
                            uni.showToast({
                                title: '照片已添加位置信息',
                                icon: 'success'
                            });
                            
                        } catch (error) {
                            uni.hideLoading();
                            console.error('处理图片失败：', error);
                            
                            // 如果处理失败，仍然添加原图
                            this.imageList = [...this.imageList, tempFilePath];
                            uni.showToast({
                                title: '图片已添加，但位置信息添加失败',
                                icon: 'none'
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

            // ...existing code...
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
        }
    }
</script>

<style>
    /* ...existing styles... */
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
</style>