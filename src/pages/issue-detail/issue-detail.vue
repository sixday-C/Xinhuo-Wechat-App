<template>
	<view class="detail-page">
		<!-- 自定义导航栏 -->
		<view class="custom-nav-bar">
			<view class="back-button" @click="goBack">
				<text class="back-icon">‹</text>
				<text>返回</text>
			</view>
			<view class="nav-title">公告详情</view>
		</view>

		<!-- 页面内容容器 -->
		<view class="content-container">
			<!-- 加载中 -->
			<view v-if="isLoading" class="loading-text">
				<text>正在加载详情...</text>
			</view>

			<!-- 错误信息 -->
			<view v-if="error" class="error-text">
				<text>{{ error }}</text>
			</view>

			<!-- 问题详情卡片 -->
			<view v-if="issueDetails && !isLoading" class="detail-card">
				<!-- 标题 -->
				<view class="detail-header">
					<text class="header-icon">#</text>
					<text class="header-title">{{ issueDetails.title }}</text>
				</view>

				<!-- 基本信息 -->
				<view class="info-section">
					<view class="info-line">
						<text class="info-icon">🔥</text>
						<text class="info-label">查看次数：</text>
						<text class="info-value">{{ issueDetails.view_count || 0 }} 次</text>
					</view>
				</view>

				<!-- 详细描述 -->
				<view class="content-section">
					<view class="content-title">详细情况</view>
					<view class="content-body">
						<text>{{ issueDetails.content }}</text>
					</view>
				</view>

				<!-- 相关图片 -->
				<view class="image-gallery" v-if="issueDetails.images && issueDetails.images.length > 0">
					<view class="gallery-title">相关图片</view>
					<view class="image-list">
						<view class="image-wrapper" v-for="(image, index) in issueDetails.images" :key="index">
							<image 
								class="issue-image" 
								:src="image.url || image" 
								mode="aspectFill"
								@click="previewImage(image.url || image)"
							></image>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	const noticeDemo = uniCloud.importObject("notice-demo");

	export default {
		data() {
			return {
				issueId: null,
				issueDetails: null,
				isLoading: true,
				error: null,
			};
		},
		onLoad(options) {
			if (options.id) {
				this.issueId = options.id;
				this.fetchIssueDetails();
			} else {
				this.error = "无法获取公告ID，请返回重试。";
				this.isLoading = false;
			}
		},
		methods: {
			// FIX: fetchIssueDetails 方法已更新，增加了防刷逻辑
			async fetchIssueDetails() {
				this.isLoading = true;
				this.error = null;

				try {
					// --- 防刷逻辑开始 ---
					const now = Date.now();
					const fiveMinutes = 5 * 60 * 1000;
					
					// 1. 获取本地存储的查看记录
					const timestamps = uni.getStorageSync('notice_view_timestamps') || {};
					const lastViewTime = timestamps[this.issueId];

					let shouldIncrement = true; // 默认需要增加查看次数

					if (lastViewTime && (now - lastViewTime < fiveMinutes)) {
						// 5分钟内已查看过，不增加查看次数
						shouldIncrement = false;
						console.log(`公告 ${this.issueId} 在5分钟内已被查看，本次不增加浏览量。`);
					}
					// --- 防刷逻辑结束 ---

					// 2. 调用云对象，并传入 increment 参数
					const res = await noticeDemo.getNoticeDetail({
						id: this.issueId,
						increment: shouldIncrement
					});

					if (res.code !== 0) {
						throw new Error(res.msg || '获取详情失败');
					}
					
					// 3. 如果成功增加了查看次数，则更新本地时间戳
					if (shouldIncrement) {
						timestamps[this.issueId] = now;
						uni.setStorageSync('notice_view_timestamps', timestamps);
						console.log(`公告 ${this.issueId} 浏览量+1，并记录时间戳。`);
					}
					
					this.issueDetails = res.data;

				} catch (e) {
					console.error("fetchIssueDetails error:", e);
					this.error = e.message || "详情加载失败，请稍后重试。";
				} finally {
					this.isLoading = false;
				}
			},
			
			previewImage(currentUrl) {
				const urls = this.issueDetails.images.map(img => (typeof img === 'object' ? img.url : img));
				uni.previewImage({
					current: currentUrl,
					urls: urls
				});
			},

			goBack() {
				uni.navigateBack();
			}
		}
	}
</script>

<style>
	/* 样式与之前保持一致 */
	.detail-page {
		background-color: #f4f4f4;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.custom-nav-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 88rpx;
		padding-top: var(--status-bar-height);
		background-color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
		z-index: 99;
	}
	.back-button {
		position: absolute;
		left: 20rpx;
		top: var(--status-bar-height);
		height: 88rpx;
		display: flex;
		align-items: center;
		padding: 0 20rpx;
		font-size: 30rpx;
		color: #333;
	}
	.back-button:active {
		opacity: 0.7;
	}
	.back-icon {
		font-size: 40rpx;
		font-weight: bold;
		margin-right: 5rpx;
	}
	.nav-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}
	.content-container {
		padding: 20rpx;
		padding-top: calc(88rpx + var(--status-bar-height) + 20rpx);
	}
	.loading-text, .error-text {
		text-align: center;
		padding: 80rpx 40rpx;
		color: #999;
	}
	.error-text {
		color: #e54d42;
	}
	.detail-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
	}
	.detail-header {
		display: flex;
		align-items: flex-start;
		padding-bottom: 25rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.header-icon {
		font-size: 36rpx;
		color: #007AFF;
		font-weight: bold;
		margin-right: 20rpx;
		line-height: 1.4;
	}
	.header-title {
		font-size: 38rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
		line-height: 1.4;
	}
	.info-section {
		padding: 25rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	.info-line {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		font-size: 28rpx;
	}
	.info-line:last-child {
		margin-bottom: 0;
	}
	.info-icon {
		margin-right: 15rpx;
	}
	.info-label {
		color: #666;
	}
	.info-value {
		color: #333;
		font-weight: 500;
	}
	.content-section {
		padding-top: 25rpx;
	}
	.content-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	.content-body {
		font-size: 30rpx;
		color: #555;
		line-height: 1.8;
		text-align: justify;
	}
	.image-gallery {
		padding-top: 25rpx;
		margin-top: 25rpx;
		border-top: 1px solid #f0f0f0;
	}
	.gallery-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	.image-list {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}
	.image-wrapper {
		width: calc(33.333% - 10rpx);
		aspect-ratio: 1 / 1;
	}
	.issue-image {
		width: 100%;
		height: 100%;
		border-radius: 8rpx;
		background-color: #f0f0f0;
	}
</style>
