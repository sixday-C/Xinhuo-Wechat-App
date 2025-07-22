<template>
	<view class="page-container">
		<view class="header">
			<view class="title">热门公示</view>
			<view class="subtitle">社区高频及重点问题关注</view>
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
				<view class="issue-card" v-for="issue in hotIssues" :key="issue.id" @click="viewIssueDetails(issue.id)">
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
						<text class="details-link">查看详情</text>
					</view>
				</view>
			</block>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				hotIssues: [], // 用于存储从API获取的热门问题
				isLoading: true, // 控制加载状态的显示
				error: null, // 存储错误信息
			};
		},
		onLoad() {
			// 页面加载时，调用方法获取数据
			this.fetchHotIssues();
		},
		methods: {
			// 从后端API获取热门问题数据
			fetchHotIssues() {
				this.isLoading = true;
				this.error = null;
				
				// 使用 uni.request 发起网络请求
				// **注意**: 这里的URL是无效的占位符，需要替换为你的后端API地址
				uni.request({
					url: 'https://your-backend-api.com/hot-issues', // <--- 后端API的URL
					method: 'GET',
					success: (res) => {
						// 假设API成功返回数据，且数据在 res.data.data 中
						// this.hotIssues = res.data.data;
						
						// --- 由于URL无效，我们在这里模拟成功返回的数据 ---
						console.log("网络请求成功（模拟）");
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
						this.hotIssues = mockDataFromServer;
						// --- 模拟数据结束 ---
					},
					fail: (err) => {
						// 网络请求失败
						console.error("API请求失败:", err);
						this.error = "数据加载失败，请稍后重试。";
						// 在实际开发中，你可能还想在这里使用模拟数据作为备用
						// this.hotIssues = this.getMockData(); 
					},
					complete: () => {
						// 请求完成，无论成功或失败都关闭加载状态
						this.isLoading = false;
					}
				});
			},
			
			// 跳转到问题详情页
			viewIssueDetails(issueId) {
				// 使用 uni.navigateTo 进行页面跳转
				uni.navigateTo({
					// **注意**: 确保这个路径与你在 pages.json 中配置的路径一致
					url: `/pages/issue-detail/issue-detail?id=${issueId}` // 将问题id作为参数传递
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
	
	.loading-text, .error-text {
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
