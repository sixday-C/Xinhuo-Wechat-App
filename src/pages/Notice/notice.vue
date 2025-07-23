<template>
	<view class="page-container">
		<view class="header">
			<view class="title">热门公示</view>
			<view class="subtitle">社区高频及重点问题关注</view>
		</view>

		<!-- 新增排序选项 -->
		<view class="sort-container">
			<view
				class="sort-option"
				:class="{ 'active': sortBy === 'hot' }"
				@click="changeSort('hot')"
			>
				按热度
			</view>
			<view
				class="sort-option"
				:class="{ 'active': sortBy === 'time' }"
				@click="changeSort('time')"
			>
				按时间
			</view>
		</view>
		
		<view class="issue-list">
			<!-- 加载中提示 -->
			<view v-if="isLoading" class="loading-text">
				<text>正在加载热门问题...</text>
			</view>
			
			<!-- 错误提示 -->
			<view v-if="error" class="error-text">
				<text>{{ error }}</text>
			</view>

			<!-- 问题列表 -->
			<block v-if="!isLoading && !error">
				<view v-if="hotIssues.length === 0" class="empty-text">
					<text>暂无热门公示</text>
				</view>
				<view class="issue-card" v-for="issue in hotIssues" :key="issue._id" @click="viewIssueDetails(issue._id)">
					<view class="card-header">
						<text class="topic-icon">#</text>
						<text class="topic-title">{{ issue.title }}</text>
					</view>
					<view class="card-body">
						<view class="info-line">
							<text class="info-icon">🔥</text>
							<text class="info-label">查看次数：</text>
							<text class="info-value">{{ issue.view_count || 0 }} 次</text>
						</view>
					</view>
					<view class="card-footer">
						<text>发布于: {{ formatTime(issue.publish_time) }}</text>
						<text class="details-link">查看详情</text>
					</view>
				</view>
			</block>
		</view>
	</view>
</template>

<script>
	const noticeDemo = uniCloud.importObject("notice-demo");

	export default {
		data() {
			return {
				hotIssues: [], // 用于显示的、已排序的列表
				allIssues: [], // 从后端获取的原始列表
				isLoading: true,
				error: null,
				communityId: "687f52b3367dc042238a07ad",
				sortBy: 'hot' // 默认按热度排序
			};
		},
		onShow() {
			this.fetchHotIssues();
		},
		methods: {
			async fetchHotIssues() {
				this.isLoading = true;
				this.error = null;
				
				try {
					const res = await noticeDemo.getNotices({
						community_id: this.communityId,
						page: 1,
						pageSize: 10,
					});

					if (res.code !== 0) {
						throw new Error(res.msg || '获取数据失败');
					}
					
					this.allIssues = res.data.list; // 存储原始数据
					this.sortIssues(); // 进行初次排序
					
				} catch (e) {
					console.error("fetchHotIssues error:", e);
					this.error = e.message || "数据加载失败，请稍后重试。";
				} finally {
					this.isLoading = false;
				}
			},

			// 切换排序方式
			changeSort(type) {
				if (this.sortBy === type) return; // 如果已经是当前排序方式，则不执行任何操作
				this.sortBy = type;
				this.sortIssues();
			},

			// 执行排序
			sortIssues() {
				// 从原始列表中创建一个可变副本进行排序
				let sorted = [...this.allIssues];

				if (this.sortBy === 'hot') {
					// 按热度排序
					sorted.sort((a, b) => {
						// 首先按查看次数降序
						if ((b.view_count || 0) !== (a.view_count || 0)) {
							return (b.view_count || 0) - (a.view_count || 0);
						}
						// 次数相同，按时间降序
						return (b.publish_time || 0) - (a.publish_time || 0);
					});
				} else if (this.sortBy === 'time') {
					// 按时间排序
					sorted.sort((a, b) => {
						// 按发布时间降序
						// 将没有时间的排在最后
						if (!a.publish_time) return 1;
						if (!b.publish_time) return -1;
						return b.publish_time - a.publish_time;
					});
				}

				this.hotIssues = sorted;
			},
			
			viewIssueDetails(issueId) {
				uni.navigateTo({
					url: `/pages/issue-detail/issue-detail?id=${issueId}`
				});
			},

			formatTime(timestamp) {
				if (!timestamp) return '未知';
				const date = new Date(timestamp);
				const year = date.getFullYear();
				const month = ('0' + (date.getMonth() + 1)).slice(-2);
				const day = ('0' + date.getDate()).slice(-2);
				return `${year}-${month}-${day}`;
			}
		}
	}
</script>

<style>
	/* 样式与之前保持一致 */
	.page-container {
		background-color: #f4f4f4;
		min-height: 100vh;
	}
	.header {
		padding: 40rpx 30rpx;
		background-color: #ffffff;
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
	
	/* 新增排序容器样式 */
	.sort-container {
		position: sticky;
		top: 0;
		display: flex;
		gap: 40rpx;
		padding: 20rpx 30rpx;
		background-color: #f4f4f4;
		z-index: 10;
		border-bottom: 1px solid #e5e5e5;
	}

	.sort-option {
		font-size: 28rpx;
		color: #666;
		font-weight: normal;
		transition: color 0.2s, font-weight 0.2s;
	}

	.sort-option.active {
		color: #333;
		font-weight: bold;
	}

	.issue-list {
		padding: 20rpx;
	}
	.loading-text, .error-text, .empty-text {
		text-align: center;
		padding: 40rpx;
		color: #999;
	}
	.error-text {
		color: #e54d42;
	}
	.issue-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: transform 0.2s;
	}
	.issue-card:active {
		transform: scale(0.98);
	}
	.card-header {
		display: flex;
		align-items: center;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 20rpx;
		margin-bottom: 20rpx;
	}
	.topic-icon {
		font-size: 32rpx;
		color: #007AFF;
		font-weight: bold;
		margin-right: 15rpx;
	}
	.topic-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
	}
	.card-body .info-line {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
		font-size: 28rpx;
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
	.card-footer {
		margin-top: 25rpx;
		padding-top: 20rpx;
		border-top: 1px solid #f0f0f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 24rpx;
		color: #999;
	}
	.details-link {
		color: #007AFF;
		font-weight: bold;
	}
</style>
