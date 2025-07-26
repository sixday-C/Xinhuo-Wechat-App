<template>
	<view class="page-container">
		<view class="header">
			<view class="title">社区公告</view>
			<view class="subtitle">社区最新资讯与重要通知</view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-container">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					v-model="searchKeyword" 
					placeholder="搜索公告标题或内容"
					@input="onSearchInput"
				/>
				<text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
			</view>
		</view>

		<!-- 筛选和排序选项 -->
		<view class="filter-container">
			<view class="filter-row">
				<scroll-view class="filter-scroll" scroll-x="true">
					<view class="filter-tags">
						<view 
							class="filter-tag" 
							:class="{ 'active': selectedType === '' }"
							@click="changeType('')"
						>
							全部
						</view>
						<view 
							class="filter-tag" 
							:class="{ 'active': selectedType === type.value }"
							v-for="type in noticeTypes" 
							:key="type.value"
							@click="changeType(type.value)"
						>
							{{ type.text }}
						</view>
					</view>
				</scroll-view>
			</view>
			<view class="sort-row">
				<view
					class="sort-option"
					:class="{ 'active': sortBy === 'time' }"
					@click="changeSort('time')"
				>
					<text class="sort-icon">⏰</text>
					<text>最新</text>
				</view>
				<view
					class="sort-option"
					:class="{ 'active': sortBy === 'hot' }"
					@click="changeSort('hot')"
				>
					<text class="sort-icon">🔥</text>
					<text>最热</text>
				</view>
				<view
					class="sort-option"
					:class="{ 'active': sortBy === 'top' }"
					@click="changeSort('top')"
				>
					<text class="sort-icon">📌</text>
					<text>置顶</text>
				</view>
			</view>
		</view>
		
		<!-- 公告列表 -->
		<view class="notice-list">
			<!-- 加载中提示 -->
			<view v-if="isLoading" class="loading-text">
				<text>正在加载公告...</text>
			</view>
			
			<!-- 错误提示 -->
			<view v-if="error" class="error-text">
				<text>{{ error }}</text>
				<button class="retry-btn" @click="fetchNotices">重试</button>
			</view>

			<!-- 公告列表 -->
			<block v-if="!isLoading && !error">
				<view v-if="noticeList.length === 0" class="empty-text">
					<text>{{ searchKeyword ? '没有找到相关公告' : '暂无公告' }}</text>
				</view>
				<view class="notice-card" v-for="notice in noticeList" :key="notice._id" @click="viewNoticeDetail(notice._id)">
					<!-- 置顶和重要标识 -->
					<view class="notice-badges" v-if="notice.is_top || notice.is_important">
						<view v-if="notice.is_top" class="badge badge-top">置顶</view>
						<view v-if="notice.is_important" class="badge badge-important">重要</view>
					</view>

									<!-- 封面图片 -->
				<view v-if="notice.cover_image_url" class="notice-cover">
					<image 
						class="cover-image" 
						:src="notice.cover_image_url" 
						mode="aspectFill"
						@click.stop="previewImage(notice.cover_image_url, notice.image_urls)"
					></image>
				</view>

					<!-- 公告内容 -->
					<view class="notice-content">
						<view class="notice-header">
							<view class="notice-type">
								<text class="type-icon">{{ getTypeIcon(notice.notice_type) }}</text>
								<text class="type-text">{{ getTypeText(notice.notice_type) }}</text>
							</view>
							<text class="notice-title">{{ notice.title }}</text>
						</view>

						<view class="notice-summary" v-if="notice.summary">
							<text>{{ notice.summary }}</text>
						</view>

						<view class="notice-info">
							<view class="info-row">
								<view class="info-item">
									<text class="info-icon">👁️</text>
									<text class="info-text">{{ notice.view_count || 0 }}</text>
								</view>
								<view class="info-item">
									<text class="info-icon">❤️</text>
									<text class="info-text">{{ notice.like_count || 0 }}</text>
								</view>
							</view>
							<view class="notice-time">
								<text>{{ notice.formatted_publish_time || notice.formatted_create_time }}</text>
							</view>
						</view>
					</view>

					<text class="notice-arrow">›</text>
				</view>
			</block>
		</view>

		<!-- 创建公告按钮（管理员功能） -->
		<view class="fab-container" v-if="isAdmin">
			<view class="fab" @click="createNotice">
				<text class="fab-icon">+</text>
			</view>
		</view>
	</view>
</template>

<script>
	const noticeDemo = uniCloud.importObject("notice-demo");

	export default {
		data() {
			return {
				noticeList: [],
				isLoading: true,
				error: null,
				communityId: "", // 改为空字符串，显示所有社区公告
				sortBy: 'time',
				selectedType: '',
				searchKeyword: '',
				searchTimer: null,
				page: 1,
				pageSize: 20,
				isAdmin: false, // 根据实际用户权限设置
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
		onShow() {
			this.getUserCommunity(); // 获取用户社区信息
			this.fetchNotices();
		},
		methods: {
			// 将fileID转换为CDN地址
			fileIdToCdnUrl(fileId) {
				if (!fileId) return '';
				if (fileId.startsWith('cloud://')) {
					// 根据你的云存储环境替换，这里使用常见的格式
					return fileId.replace('cloud://env-00jxtsjrq0f2', 'https://env-00jxtsjrq0f2.normal.cloudstatic.cn');
				}
				return fileId; // 已经是http/https地址
			},

			// 获取用户社区信息
			async getUserCommunity() {
				try {
					// 这里应该根据实际业务逻辑获取用户的社区ID
					// 例如从本地存储、用户信息接口等获取
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo && userInfo.community_id) {
						this.communityId = userInfo.community_id;
					} else {
						// 如果没有用户社区信息，显示所有社区的公告
						this.communityId = "";
					}
				} catch (error) {
					console.error('获取用户社区信息失败:', error);
					// 出错时显示所有社区的公告
					this.communityId = "";
				}
			},
			
			async fetchNotices() {
				this.isLoading = true;
				this.error = null;
				
				try {
					const params = {
						community_id: this.communityId,
						page: this.page,
						pageSize: this.pageSize,
						sort_by: this.sortBy,
						status: 1 // 只获取已发布的公告
					};

					// 添加可选参数
					if (this.selectedType) {
						params.notice_type = this.selectedType;
					}
					if (this.searchKeyword) {
						params.keyword = this.searchKeyword;
					}

					const res = await noticeDemo.getNotices(params);

					if (res.code !== 0) {
						throw new Error(res.msg || '获取数据失败');
					}
					
					// 处理图片数据
					this.noticeList = (res.data.list || []).map(notice => {
						// 处理封面图片：优先使用第一张images，如果没有则为空
						notice.cover_image_url = '';
						if (notice.images && notice.images.length > 0) {
							notice.cover_image_url = this.fileIdToCdnUrl(notice.images[0]);
						}
						
						// 处理所有图片URL
						notice.image_urls = Array.isArray(notice.images) 
							? notice.images.map(this.fileIdToCdnUrl).filter(url => url) 
							: [];
						
						return notice;
					});
					
				} catch (e) {
					console.error("fetchNotices error:", e);
					this.error = e.message || "数据加载失败，请稍后重试。";
				} finally {
					this.isLoading = false;
				}
			},

			// 切换排序方式
			changeSort(type) {
				if (this.sortBy === type) return;
				this.sortBy = type;
				this.page = 1;
				this.fetchNotices();
			},

			// 切换类型筛选
			changeType(type) {
				if (this.selectedType === type) return;
				this.selectedType = type;
				this.page = 1;
				this.fetchNotices();
			},

			// 搜索输入
			onSearchInput() {
				if (this.searchTimer) {
					clearTimeout(this.searchTimer);
				}
				this.searchTimer = setTimeout(() => {
					this.page = 1;
					this.fetchNotices();
				}, 500);
			},

			// 清除搜索
			clearSearch() {
				this.searchKeyword = '';
				this.page = 1;
				this.fetchNotices();
			},
			
			// 查看公告详情
			viewNoticeDetail(noticeId) {
				uni.navigateTo({
					url: `/pages/issue-detail/issue-detail?id=${noticeId}`
				});
			},

			// 预览图片
			previewImage(currentUrl, allUrls) {
				const urls = allUrls && allUrls.length > 0 ? allUrls : [currentUrl];
				uni.previewImage({
					current: currentUrl,
					urls: urls
				});
			},

			// 创建公告（管理员功能）
			createNotice() {
				uni.navigateTo({
					url: '/pages/create-notice/create-notice'
				});
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
			}
		}
	}
</script>

<style>
	.page-container {
		background-color: #f4f4f4;
		min-height: 100vh;
		padding-bottom: 120rpx; /* 为FAB按钮预留空间 */
	}
	
	/* 头部样式 */
	.header {
		padding: 40rpx 30rpx 30rpx;
		background-color: #ffffff;
		border-bottom: 1px solid #f0f0f0;
	}
	.title {
		font-size: 44rpx;
		font-weight: bold;
		color: #333;
	}
	.subtitle {
		font-size: 28rpx;
		color: #999;
		margin-top: 10rpx;
	}
	
	/* 搜索栏样式 */
	.search-container {
		padding: 20rpx 30rpx;
		background-color: #ffffff;
		border-bottom: 1px solid #f0f0f0;
	}
	.search-box {
		display: flex;
		align-items: center;
		background-color: #f8f8f8;
		border-radius: 25rpx;
		padding: 15rpx 20rpx;
		position: relative;
	}
	.search-icon {
		font-size: 28rpx;
		color: #999;
		margin-right: 15rpx;
	}
	.search-input {
		flex: 1;
		font-size: 28rpx;
		color: #333;
		background: transparent;
	}
	.clear-icon {
		font-size: 28rpx;
		color: #999;
		padding: 10rpx;
		border-radius: 50%;
		background-color: #e0e0e0;
		width: 28rpx;
		height: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	
	/* 筛选和排序样式 */
	.filter-container {
		background-color: #ffffff;
		border-bottom: 1px solid #f0f0f0;
	}
	.filter-row {
		padding: 20rpx 0;
	}
	.filter-scroll {
		white-space: nowrap;
	}
	.filter-tags {
		display: flex;
		padding: 0 30rpx;
		gap: 20rpx;
	}
	.filter-tag {
		flex-shrink: 0;
		padding: 12rpx 24rpx;
		background-color: #f8f8f8;
		border-radius: 20rpx;
		font-size: 26rpx;
		color: #666;
		transition: all 0.3s;
	}
	.filter-tag.active {
		background-color: #007AFF;
		color: #ffffff;
	}
	
	.sort-row {
		display: flex;
		justify-content: space-around;
		padding: 15rpx 30rpx;
		border-top: 1px solid #f0f0f0;
	}
	.sort-option {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 26rpx;
		color: #666;
		transition: all 0.3s;
	}
	.sort-option.active {
		background-color: #f0f8ff;
		color: #007AFF;
		font-weight: bold;
	}
	.sort-icon {
		font-size: 24rpx;
	}

	/* 公告列表样式 */
	.notice-list {
		padding: 20rpx;
	}
	.loading-text, .error-text, .empty-text {
		text-align: center;
		padding: 80rpx 40rpx;
		color: #999;
		font-size: 28rpx;
	}
	.error-text {
		color: #e54d42;
	}
	.retry-btn {
		margin-top: 20rpx;
		padding: 15rpx 30rpx;
		background-color: #007AFF;
		color: #ffffff;
		border: none;
		border-radius: 25rpx;
		font-size: 26rpx;
	}
	
	/* 公告卡片样式 */
	.notice-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 0;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: transform 0.2s;
		overflow: hidden;
		position: relative;
		display: flex;
	}
	.notice-card:active {
		transform: scale(0.98);
	}
	
	/* 徽章样式 */
	.notice-badges {
		position: absolute;
		top: 15rpx;
		right: 15rpx;
		z-index: 2;
		display: flex;
		gap: 10rpx;
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
	
	/* 封面图片样式 */
	.notice-cover {
		width: 200rpx;
		height: 150rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 12rpx;
		background-color: #f8f8f8;
	}
	.cover-image {
		width: 100%;
		height: 100%;
		background-color: #f0f0f0;
		border-radius: 12rpx;
		transition: transform 0.2s;
	}
	.cover-image:active {
		transform: scale(0.95);
	}
	
	/* 公告内容样式 */
	.notice-content {
		flex: 1;
		padding: 25rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.notice-header {
		margin-bottom: 15rpx;
	}
	.notice-type {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}
	.type-icon {
		font-size: 24rpx;
		margin-right: 8rpx;
	}
	.type-text {
		font-size: 22rpx;
		color: #007AFF;
		background-color: #f0f8ff;
		padding: 4rpx 8rpx;
		border-radius: 8rpx;
	}
	.notice-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}
	.notice-summary {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
		margin-bottom: 15rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}
	.notice-info {
		margin-top: auto;
	}
	.info-row {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 8rpx;
	}
	.info-item {
		display: flex;
		align-items: center;
		gap: 6rpx;
	}
	.info-icon {
		font-size: 20rpx;
	}
	.info-text {
		font-size: 22rpx;
		color: #999;
	}
	.notice-time {
		font-size: 22rpx;
		color: #999;
	}
	
	/* 箭头样式 */
	.notice-arrow {
		position: absolute;
		right: 20rpx;
		top: 50%;
		transform: translateY(-50%);
		font-size: 32rpx;
		color: #ccc;
		font-weight: bold;
	}
	
	/* 悬浮按钮样式 */
	.fab-container {
		position: fixed;
		bottom: 40rpx;
		right: 40rpx;
		z-index: 1000;
	}
	.fab {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, #007AFF, #0056b3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 16rpx rgba(0, 122, 255, 0.3);
		transition: transform 0.2s;
	}
	.fab:active {
		transform: scale(0.95);
	}
	.fab-icon {
		font-size: 48rpx;
		color: #ffffff;
		font-weight: bold;
		line-height: 1;
	}
</style>
