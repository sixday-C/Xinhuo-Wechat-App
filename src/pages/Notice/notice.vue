<template>
	<view class="page-container">
		<view class="header">
			<view class="title">热门公示</view>
			<view class="subtitle">社区高频及重点问题关注</view>
		</view>
		
		<view class="issue-list">
			<view v-if="hotIssues.length === 0" class="loading-text">
				<text>正在加载热门问题...</text>
			</view>
			
			<view class="issue-card" v-for="issue in hotIssues" :key="issue.id">
				<view class="card-header">
					<text class="topic-icon">#</text>
					<text class="topic-title">{{ issue.topic }}</text>
				</view>
				<view class="card-body">
					<view class="info-line">
						<text class="info-icon">📍</text>
						<text class="info-label">影响地点：</text>
						<text class="info-value">{{ issue.location }}</text>
					</view>
					<view class="info-line">
						<text class="info-icon">🔥</text>
						<text class="info-label">提及次数：</text>
						<text class="info-value">{{ issue.mentions }} 次</text>
					</view>
				</view>
				<view class="card-footer">
					<text>更新于: {{ issue.last_updated }}</text>
					<text class="details-link" @click="viewIssueDetails(issue.id)">查看详情</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 这是用于填充界面的“模拟数据”。
				// 后期，这个数组将由API请求返回的数据填充。
				hotIssues: [] 
			};
		},
		onLoad() {
			// 页面加载时，调用方法获取数据
			this.fetchHotIssues();
		},
		methods: {
			// 获取热门问题数据的方法
			fetchHotIssues() {
				// 现在，我们用一个延时来模拟网络请求
				setTimeout(() => {
					// 这是模拟从服务器获取到的数据
					const mockDataFromServer = [
						{
							id: 'hot001',
							topic: '关于小区南门车辆乱停放问题',
							location: '南门主干道及周边',
							mentions: 42,
							last_updated: '2025-07-02'
						},
						{
							id: 'hot002',
							topic: 'C栋顶楼天台防水层老化漏水',
							location: 'C栋 15-18层',
							mentions: 28,
							last_updated: '2025-07-01'
						},
						{
							id: 'hot003',
							topic: '傍晚时段健身器材区域噪音扰民',
							location: '中心花园健身区',
							mentions: 19,
							last_updated: '2025-06-30'
						},
						{
							id: 'hot004',
							topic: '建议增设宠物便溺设施',
							location: '小区所有草坪区域',
							mentions: 15,
							last_updated: '2025-06-29'
						}
					];
					
					// 将获取到的数据赋值给页面的hotIssues
					this.hotIssues = mockDataFromServer;

				}, 500); // 模拟500ms的网络延迟
			},
			
			// 点击“查看详情”的占位方法
			viewIssueDetails(issueId) {
				uni.showToast({
					title: `点击了问题 ${issueId}，详情页待开发`,
					icon: 'none'
				});
			}
		}
	}
</script>

<style>
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

	.issue-list {
		padding: 20rpx;
	}
	
	.loading-text {
		text-align: center;
		padding: 40rpx;
		color: #999;
	}

	.issue-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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
	.details-link:active {
		opacity: 0.7;
	}
</style>