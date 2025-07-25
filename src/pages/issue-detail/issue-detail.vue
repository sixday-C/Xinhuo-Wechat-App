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

			<!-- 公告详情卡片 -->
			<view v-if="issueDetails && !isLoading" class="detail-card">
				<!-- 标题和标识 -->
				<view class="detail-header">
					<view class="header-badges" v-if="issueDetails.is_top || issueDetails.is_important">
						<view v-if="issueDetails.is_top" class="badge badge-top">置顶</view>
						<view v-if="issueDetails.is_important" class="badge badge-important">重要</view>
					</view>
					<view class="header-type">
						<text class="type-icon">{{ getTypeIcon(issueDetails.notice_type) }}</text>
						<text class="type-text">{{ getTypeText(issueDetails.notice_type) }}</text>
					</view>
					<text class="header-title">{{ issueDetails.title }}</text>
				</view>

				<!-- 发布信息 -->
				<view class="publish-info">
					<view class="publisher">
						<text class="publisher-icon">👤</text>
						<text class="publisher-name">{{ issueDetails.publisher_name || '系统管理员' }}</text>
					</view>
					<view class="publish-time">
						<text class="time-icon">⏰</text>
						<text class="time-text">{{ issueDetails.formatted_publish_time || issueDetails.formatted_create_time }}</text>
					</view>
				</view>

				<!-- 封面图片 -->
				<view v-if="issueDetails.cover_image_url" class="cover-section">
					<image 
						class="cover-image" 
						:src="issueDetails.cover_image_url" 
						mode="aspectFill"
						@click="previewImage(issueDetails.cover_image_url)"
					></image>
				</view>

				<!-- 摘要 -->
				<view v-if="issueDetails.summary" class="summary-section">
					<view class="section-title">摘要</view>
					<text class="summary-text">{{ issueDetails.summary }}</text>
				</view>

				<!-- 详细内容 -->
				<view class="content-section">
					<view class="section-title">详细内容</view>
					<view class="content-body">
						<text class="content-text">{{ issueDetails.content }}</text>
					</view>
				</view>

				<!-- 相关图片 -->
				<view class="image-gallery" v-if="issueDetails.http_image_urls && issueDetails.http_image_urls.length > 0">
					<view class="section-title">相关图片</view>
					<view class="image-grid">
						<view class="image-wrapper" v-for="(imageUrl, index) in issueDetails.http_image_urls" :key="index">
							<image 
								class="gallery-image" 
								:src="imageUrl" 
								mode="aspectFill"
								@click="previewImages(imageUrl)"
							></image>
						</view>
					</view>
				</view>

				<!-- 附件 -->
				<view v-if="issueDetails.processed_attachments && issueDetails.processed_attachments.length > 0" class="attachment-section">
					<view class="section-title">附件</view>
					<view class="attachment-list">
						<view class="attachment-item" v-for="(attachment, index) in issueDetails.processed_attachments" :key="index">
							<text class="attachment-icon">📎</text>
							<text class="attachment-name">{{ attachment.file_name || '附件文件' }}</text>
							<text class="attachment-size" v-if="attachment.file_size">{{ formatFileSize(attachment.file_size) }}</text>
						</view>
					</view>
				</view>

				<!-- 标签 -->
				<view v-if="issueDetails.tags && issueDetails.tags.length > 0" class="tags-section">
					<view class="section-title">标签</view>
					<view class="tags-list">
						<text class="tag" v-for="(tag, index) in issueDetails.tags" :key="index">{{ tag }}</text>
					</view>
				</view>

				<!-- 统计信息 -->
				<view class="stats-section">
					<view class="stats-row">
						<view class="stat-item">
							<text class="stat-icon">👁️</text>
							<text class="stat-label">查看</text>
							<text class="stat-value">{{ issueDetails.view_count || 0 }}</text>
						</view>
						<view class="stat-item" @click="toggleLike">
							<text class="stat-icon" :class="{ 'liked': isLiked }">❤️</text>
							<text class="stat-label">点赞</text>
							<text class="stat-value">{{ currentLikeCount }}</text>
						</view>
					</view>
				</view>

				<!-- 过期时间提醒 -->
				<view v-if="issueDetails.expire_time" class="expire-notice">
					<text class="expire-icon">⚠️</text>
					<text class="expire-text">此公告将于 {{ formatTime(issueDetails.expire_time) }} 过期</text>
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
				isLiked: false,
				currentLikeCount: 0,
				noticeTypes: [
					{ value: 'urgent', text: '紧急通知' },
					{ value: 'maintenance', text: '维修公告' },
					{ value: 'activity', text: '活动通知' },
					{ value: 'policy', text: '政策通知' },
					{ value: 'general', text: '一般公告' },
					{ value: 'announcement', text: '重要公告' }
				]
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
					this.currentLikeCount = res.data.like_count || 0;
					
					// 检查用户是否已点赞（这里可以从本地存储或服务器获取）
					this.checkLikeStatus();

				} catch (e) {
					console.error("fetchIssueDetails error:", e);
					this.error = e.message || "详情加载失败，请稍后重试。";
				} finally {
					this.isLoading = false;
				}
			},

			// 检查点赞状态
			checkLikeStatus() {
				const likedNotices = uni.getStorageSync('liked_notices') || [];
				this.isLiked = likedNotices.includes(this.issueId);
			},

			// 切换点赞状态
			async toggleLike() {
				try {
					const action = this.isLiked ? 'unlike' : 'like';
					const res = await noticeDemo.likeNotice({
						id: this.issueId,
						action: action
					});

					if (res.code === 0) {
						this.isLiked = !this.isLiked;
						this.currentLikeCount += this.isLiked ? 1 : -1;
						
						// 更新本地存储
						let likedNotices = uni.getStorageSync('liked_notices') || [];
						if (this.isLiked) {
							likedNotices.push(this.issueId);
						} else {
							likedNotices = likedNotices.filter(id => id !== this.issueId);
						}
						uni.setStorageSync('liked_notices', likedNotices);
						
						uni.showToast({
							title: this.isLiked ? '点赞成功' : '取消点赞',
							icon: 'success'
						});
					}
				} catch (e) {
					console.error('点赞操作失败:', e);
					uni.showToast({
						title: '操作失败，请稍后重试',
						icon: 'none'
					});
				}
			},
			
			// 预览单张图片
			previewImage(currentUrl) {
				uni.previewImage({
					current: currentUrl,
					urls: [currentUrl]
				});
			},

			// 预览多张图片
			previewImages(currentUrl) {
				const urls = this.issueDetails.http_image_urls || [];
				uni.previewImage({
					current: currentUrl,
					urls: urls
				});
			},

			// 格式化文件大小
			formatFileSize(bytes) {
				if (bytes === 0) return '0 B';
				const k = 1024;
				const sizes = ['B', 'KB', 'MB', 'GB'];
				const i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
			},

			// 格式化时间
			formatTime(timestamp) {
				if (!timestamp) return '';
				const date = new Date(timestamp);
				const year = date.getFullYear();
				const month = ('0' + (date.getMonth() + 1)).slice(-2);
				const day = ('0' + date.getDate()).slice(-2);
				const hour = ('0' + date.getHours()).slice(-2);
				const minute = ('0' + date.getMinutes()).slice(-2);
				return `${year}-${month}-${day} ${hour}:${minute}`;
			},

			// 获取类型图标
			getTypeIcon(type) {
				const iconMap = {
					urgent: '🚨',
					maintenance: '🔧',
					activity: '🎉',
					policy: '📋',
					general: '📝',
					announcement: '📢'
				};
				return iconMap[type] || '📝';
			},

			// 获取类型文本
			getTypeText(type) {
				const typeObj = this.noticeTypes.find(t => t.value === type);
				return typeObj ? typeObj.text : '一般公告';
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
		padding: 0;
		overflow: hidden;
	}
	
	/* 头部样式 */
	.detail-header {
		padding: 30rpx;
		border-bottom: 1px solid #f0f0f0;
		position: relative;
	}
	.header-badges {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		display: flex;
		gap: 10rpx;
		z-index: 2;
	}
	.badge {
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
		font-size: 20rpx;
		color: #ffffff;
		font-weight: bold;
	}
	.badge-top {
		background-color: #ff3333;
	}
	.badge-important {
		background-color: #ff9900;
	}
	.header-type {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
	}
	.type-icon {
		font-size: 28rpx;
		margin-right: 10rpx;
	}
	.type-text {
		font-size: 24rpx;
		color: #007AFF;
		background-color: #f0f8ff;
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
		font-weight: bold;
	}
	.header-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		line-height: 1.4;
		margin-right: 120rpx; /* 为徽章预留空间 */
	}
	
	/* 发布信息样式 */
	.publish-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #f8f9fa;
		border-bottom: 1px solid #f0f0f0;
	}
	.publisher, .publish-time {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	.publisher-icon, .time-icon {
		font-size: 20rpx;
		color: #666;
	}
	.publisher-name, .time-text {
		font-size: 24rpx;
		color: #666;
	}
	
	/* 封面图片样式 */
	.cover-section {
		width: 100%;
		height: 400rpx;
	}
	.cover-image {
		width: 100%;
		height: 100%;
		background-color: #f0f0f0;
	}
	
	/* 通用节标题 */
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	/* 摘要样式 */
	.summary-section {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.summary-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		background-color: #f8f9fa;
		padding: 20rpx;
		border-radius: 12rpx;
		border-left: 4rpx solid #007AFF;
	}
	
	/* 内容样式 */
	.content-section {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.content-body {
		margin-top: 10rpx;
	}
	.content-text {
		font-size: 30rpx;
		color: #333;
		line-height: 1.8;
		text-align: justify;
	}
	
	/* 图片画廊样式 */
	.image-gallery {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.image-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
		margin-top: 10rpx;
	}
	.image-wrapper {
		width: calc(33.333% - 10rpx);
		aspect-ratio: 1 / 1;
	}
	.gallery-image {
		width: 100%;
		height: 100%;
		border-radius: 12rpx;
		background-color: #f0f0f0;
	}
	
	/* 附件样式 */
	.attachment-section {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.attachment-list {
		margin-top: 10rpx;
	}
	.attachment-item {
		display: flex;
		align-items: center;
		padding: 15rpx 20rpx;
		background-color: #f8f9fa;
		border-radius: 12rpx;
		margin-bottom: 15rpx;
		gap: 15rpx;
	}
	.attachment-item:last-child {
		margin-bottom: 0;
	}
	.attachment-icon {
		font-size: 24rpx;
		color: #666;
	}
	.attachment-name {
		flex: 1;
		font-size: 26rpx;
		color: #333;
	}
	.attachment-size {
		font-size: 22rpx;
		color: #999;
	}
	
	/* 标签样式 */
	.tags-section {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-top: 10rpx;
	}
	.tag {
		padding: 8rpx 16rpx;
		background-color: #e7f3ff;
		color: #007AFF;
		border-radius: 16rpx;
		font-size: 24rpx;
		font-weight: 500;
	}
	
	/* 统计信息样式 */
	.stats-section {
		padding: 25rpx 30rpx;
		border-bottom: 1px solid #f0f0f0;
	}
	.stats-row {
		display: flex;
		justify-content: space-around;
		margin-top: 10rpx;
	}
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		padding: 15rpx;
		border-radius: 12rpx;
		min-width: 120rpx;
		transition: background-color 0.3s;
	}
	.stat-item:active {
		background-color: #f0f0f0;
	}
	.stat-icon {
		font-size: 28rpx;
		transition: transform 0.3s;
	}
	.stat-icon.liked {
		color: #ff3333;
		transform: scale(1.1);
	}
	.stat-label {
		font-size: 22rpx;
		color: #666;
	}
	.stat-value {
		font-size: 26rpx;
		color: #333;
		font-weight: bold;
	}
	
	/* 过期提醒样式 */
	.expire-notice {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 20rpx 30rpx;
		background-color: #fff3cd;
		border-left: 4rpx solid #ffc107;
	}
	.expire-icon {
		font-size: 24rpx;
		color: #856404;
	}
	.expire-text {
		font-size: 26rpx;
		color: #856404;
		flex: 1;
	}
</style>
