<template>
	<view class="detail-page">
		<!-- 自定义导航栏 -->
		<view class="custom-nav-bar">
			<view class="back-button" @click="goBack">
				<text class="back-icon">‹</text>
				<text>返回</text>
			</view>
			<view class="nav-title">问题详情</view>
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
					<text class="header-title">{{ issueDetails.topic }}</text>
				</view>

				<!-- 基本信息 -->
				<view class="info-section">
					<view class="info-line">
						<text class="info-icon">📍</text>
						<text class="info-label">影响地点：</text>
						<text class="info-value">{{ issueDetails.location }}</text>
					</view>
					<view class="info-line">
						<text class="info-icon">🔥</text>
						<text class="info-label">提及次数：</text>
						<text class="info-value">{{ issueDetails.mentions }} 次</text>
					</view>
				</view>

				<!-- 详细描述 -->
				<view class="content-section">
					<view class="content-title">详细情况</view>
					<view class="content-body">
						<text>{{ issueDetails.content }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				issueId: null,
				issueDetails: null, // 存储问题详情
				isLoading: true,
				error: null,
			};
		},
		onLoad(options) {
			// onLoad生命周期函数可以获取到页面跳转时传递的参数
			if (options.id) {
				this.issueId = options.id;
				this.fetchIssueDetails();
			} else {
				this.error = "无法获取问题ID，请返回重试。";
				this.isLoading = false;
			}
		},
		methods: {
			// 获取问题详情
			fetchIssueDetails() {
				this.isLoading = true;
				this.error = null;

				// **注意**: 这里的URL是无效的占位符
				uni.request({
					url: `https://your-backend-api.com/issues/${this.issueId}`, // <--- 详情页的API URL
					method: 'GET',
					success: (res) => {
						// --- 同样，由于URL无效，我们模拟成功返回的数据 ---
						console.log(`网络请求详情成功（模拟），ID: ${this.issueId}`);
						const allIssues = {
							'hot001': {
								id: 'hot001',
								topic: '关于小区南门车辆乱停放问题',
								location: '南门主干道及周边',
								mentions: 42,
								content: '近期，大量业主反映，小区南门出入口及消防通道长期被外来车辆和部分业主车辆违规占用，严重影响了正常通行和消防安全。尤其在早晚高峰期，拥堵现象十分严重，建议物业加强管理，增设禁停标识，并对违停车辆进行处理。'
							},
							'hot002': {
								id: 'hot002',
								topic: 'C栋顶楼天台防水层老化漏水',
								location: 'C栋 15-18层',
								mentions: 28,
								content: 'C栋顶楼的天台防水材料已使用多年，出现明显老化、开裂迹象。每逢雨季，顶层及次顶层（18楼、17楼）住户家中均出现不同程度的渗水和墙面发霉现象，严重影响居住质量。希望能尽快安排专业人员勘察并进行维修。'
							},
							'hot003': {
								id: 'hot003',
								topic: '傍晚时段健身器材区域噪音扰民',
								location: '中心花园健身区',
								mentions: 19,
								content: '每天傍晚6点至9点，中心花园的健身器材区域聚集了大量人群，部分人员在使用器材时发出巨大声响，同时有广场舞音乐声音过大，对周边楼栋的住户造成了严重的噪音干扰，希望能够规定活动时间并控制音量。'
							},
							'hot004': {
								id: 'hot004',
								topic: '建议增设宠物便溺设施',
								location: '小区所有草坪区域',
								mentions: 15,
								content: '随着小区内饲养宠物的家庭增多，草坪及公共区域的宠物粪便问题日益突出，影响环境卫生。建议在几个主要绿地区域增设宠物厕所或提供免费的拾便袋，并加强宣传，引导宠物主人文明养宠。'
							}
						};
						
						this.issueDetails = allIssues[this.issueId] || null;
						if (!this.issueDetails) {
							this.error = "未找到该问题的详细信息。";
						}
						// --- 模拟数据结束 ---
					},
					fail: (err) => {
						console.error("详情API请求失败:", err);
						this.error = "详情加载失败，请检查网络后重试。";
					},
					complete: () => {
						this.isLoading = false;
					}
				});
			},
			// 返回上一页
			goBack() {
				uni.navigateBack();
			}
		}
	}
</script>

<style>
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
		height: 88rpx; /* 自定义导航栏高度 */
		padding-top: var(--status-bar-height); /* 适配微信小程序状态栏 */
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
		padding-top: calc(88rpx + var(--status-bar-height)); /* 预留出导航栏空间 */
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

</style>
