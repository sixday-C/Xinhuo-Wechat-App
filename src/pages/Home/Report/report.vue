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
	</view>
</template>

<script>
	export default {
		data() {
			return {
				imageList: [], // 存储上传的图片路径
				description: '', // 存储问题描述
				isAnonymous: false // 匿名状态，默认为 false
			};
		},
		methods: {
			// 调用API选择图片
			chooseImage() {
				uni.chooseImage({
					count: 3 - this.imageList.length, // 最多可以选择的图片张数
					sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图
					sourceType: ['album', 'camera'], //从相册选择或使用相机拍照
					success: (res) => {
						// 将新选择的图片追加到现有列表中
						this.imageList = [...this.imageList, ...res.tempFilePaths];
					}
				});
			},
			// 预览图片
			previewImage(currentIndex) {
				uni.previewImage({
					current: currentIndex,
					urls: this.imageList
				});
			},
			// 删除图片
			deleteImage(deleteIndex) {
				this.imageList.splice(deleteIndex, 1);
			},
			// 监听开关状态变化
			handleSwitchChange(e) {
				this.isAnonymous = e.detail.value;
			},
			// 提交表单
			handleSubmit() {
				if (!this.description) {
					uni.showToast({
						title: '问题描述不能为空',
						icon: 'none'
					});
					return;
				}
				
				// 此处为模拟提交，实际项目中应调用 uni.request 发送到后端服务器
				uni.showModal({
					title: '提交内容确认',
					content: `问题描述: ${this.description}\n匿名状态: ${this.isAnonymous ? '是' : '否'}\n图片数量: ${this.imageList.length}张`,
					success: (res) => {
						if (res.confirm) {
							console.log('用户点击确定');
							// 在这里执行上传服务器等操作
							uni.showLoading({ title: '正在提交...'})
							setTimeout(() => {
								uni.hideLoading();
								uni.showToast({ title: '提交成功' });
								// 提交成功后返回上一页
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

	/* 1. 图片上传 */
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

	/* 2. 问题描述 */
	.description-input {
		width: 100%;
		height: 250rpx;
		font-size: 28rpx;
		line-height: 1.5;
		box-sizing: border-box;
	}

	/* 3. 匿名上报 */
	.anonymous-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.anonymous-text {
		font-size: 30rpx;
		color: #333;
	}

	/* 4. 提交按钮 */
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