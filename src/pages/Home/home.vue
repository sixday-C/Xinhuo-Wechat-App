<template>

	<view class="page-container">
		<swiper class="swiper" circular indicator-dots autoplay>
			<swiper-item>
				<view class="swiper-item" style="background-color: #a8d0e6;">
					<text class="swiper-text">社区活动宣传图 001</text>
				</view>
			</swiper-item>
			<swiper-item>
				<view class="swiper-item" style="background-color: #f7cac9;">
					<text class="swiper-text">最新通知海报 2</text>
				</view>
			</swiper-item>
			<swiper-item>
				<view class="swiper-item" style="background-color: #95e1d3;">
					<text class="swiper-text">便民服务介绍 3</text>
				</view>
			</swiper-item>
		</swiper>
 
		<view class="quick-actions">
			<view class="action-btn" @tap="handleOnlineService">
				<text>线上客服</text>
			</view>
			<view class="action-btn" @tap="handleOfflineAppointment">
				<text>线下预约</text>
			</view>
		</view>

		<view class="core-action" @tap="handleReportIssue">
			<text class="core-action-text">事务上报</text>
			<text class="core-action-subtext">点击此处快速反馈问题</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {

			}
		},
		methods: {
			// 点击"线上客服"的事件处理
			handleOnlineService() {
				uni.navigateTo({
					url:'/uni_modules/uni-id-pages/pages/login/login-withpwd'
				})
			},
			// 点击"线下预约"的事件处理
			handleOfflineAppointment() {
				uni.navigateTo({
									url: 'pages/Home/Appointment/appointment'
								});
			},
			// 点击"事务上报"的事件处理
			handleReportIssue() {
				uni.navigateTo({
									url: '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback'
				});
			}
		}
	}
</script>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #f4f4f4;
		min-height: 100vh;
		padding: 20rpx;
		box-sizing: border-box;
	}

	/* 1. 滚动栏样式 */
	.swiper {
		width: 100%;
		height: 500rpx;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	}

	.swiper-item {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}
	
	.swiper-text {
		color: #ffffff;
		font-size: 32rpx;
		font-weight: bold;
	}

	/* 2. 中间快捷功能区样式 */
	.quick-actions {
		display: flex;
		justify-content: space-between;
		width: 100%;
		margin-top: 25rpx;
	}

	.action-btn {
		width: 48%;
		height: 200rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #ffffff;
		border-radius: 15rpx;
		font-size: 30rpx;
		color: #333;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	}
	
	.action-btn:active {
		background-color: #fafafa;
	}

	/* 3. 事务上报样式 */
	.core-action {
		width: 100%;
		height: 400rpx;
		margin-top: 30rpx;
		background-image: linear-gradient(135deg, #4c83ff, #2962ff);
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #ffffff;
		box-shadow: 0 8rpx 20rpx rgba(41, 98, 255, 0.3);
	}
	
	.core-action:active {
		opacity: 0.9;
	}

	.core-action-text {
		font-size: 40rpx;
		font-weight: bold;
	}

	.core-action-subtext {
		font-size: 24rpx;
		margin-top: 10rpx;
		opacity: 0.8;
	}
</style>