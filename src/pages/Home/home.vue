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
			<view class="action-btn" @tap="handleOfflineAppointment">
				<view class="btn-icon">📅</view>
				<text class="btn-title">线下预约</text>
				<text class="btn-desc">预约社区服务窗口</text>
			</view>
		</view>

		<view class="core-action" @tap="handleReportIssue">
			<view class="core-icon">📝</view>
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
			
			// 点击"线下预约"的事件处理
			handleOfflineAppointment() {
				uni.navigateTo({
									url: '/pages/Home/Appointment/appointment'
								});
			},
			// 点击"事务上报"的事件处理
			handleReportIssue() {
				uni.navigateTo({
									url: '/pages/Home/Report/report'
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
		height: 400rpx;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
		margin-bottom: 10rpx;
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
		justify-content: center;
		width: 100%;
		margin-top: 30rpx;
	}

	.action-btn {
		width: 100%;
		height: 200rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: #ffffff;
		border-radius: 16rpx;
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}
	
	.action-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.btn-icon {
		font-size: 48rpx;
		margin-bottom: 16rpx;
	}

	.btn-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.btn-desc {
		font-size: 24rpx;
		color: #666;
		display: block;
		text-align: center;
	}

	/* 3. 事务上报样式 */
	.core-action {
		width: 100%;
		height: 320rpx;
		margin-top: 30rpx;
		background: linear-gradient(135deg, #4c83ff 0%, #2962ff 100%);
		border-radius: 20rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #ffffff;
		box-shadow: 0 12rpx 32rpx rgba(76, 131, 255, 0.4);
		transition: all 0.3s ease;
	}
	
	.core-action:active {
		transform: translateY(2rpx);
		box-shadow: 0 8rpx 24rpx rgba(76, 131, 255, 0.3);
	}

	.core-icon {
		font-size: 64rpx;
		margin-bottom: 16rpx;
		opacity: 0.9;
	}

	.core-action-text {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}

	.core-action-subtext {
		font-size: 24rpx;
		opacity: 0.8;
		text-align: center;
	}
</style>