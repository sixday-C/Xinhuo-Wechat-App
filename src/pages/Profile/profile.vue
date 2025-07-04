<template>
	<view class="page-container">
		<view class="section-card">
			<view class="section-title">居民信息</view>
			<view class="info-form">
				<view class="form-item">
					<text class="item-label">手机号码</text>
					<input class="item-input" type="number" v-model="userInfo.phone" placeholder="请输入手机号码" />
				</view>
				<view class="form-item">
					<text class="item-label">姓名</text>
					<input class="item-input" v-model="userInfo.name" placeholder="请输入您的姓名" />
				</view>
				<view class="form-item">
					<text class="item-label">楼宇门牌</text>
					<input class="item-input" v-model="userInfo.address" placeholder="例如：A栋1单元202" />
				</view>
			</view>
			<button class="save-btn" @click="saveInfo">保存信息</button>
		</view>

		<view class="section-card">
			<view class="section-title">历史记录</view>
			<view class="history-list">
				<view v-if="historyList.length === 0" class="empty-history">
					<text>暂无上报记录</text>
				</view>
				<view class="history-item" v-for="item in historyList" :key="item.id" @click="viewHistoryDetail(item)">
					<view class="item-content">
						<text class="item-title">{{ item.title }}</text>
						<text class="item-date">{{ item.date }}</text>
					</view>
					<view class="item-status" :class="{'status-processed': item.status === '已处理'}">
						{{ item.status }}
					</view>
					<text class="item-arrow">></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 用户信息数据
				userInfo: {
					phone: '',
					name: '',
					address: ''
				},
				// 历史记录的占位数据
				historyList: [{
						id: '1001',
						title: '小区东门路灯不亮',
						date: '2025-07-02',
						status: '已处理'
					},
					{
						id: '1002',
						title: 'B栋电梯有异响',
						date: '2025-07-01',
						status: '处理中'
					},
					{
						id: '1003',
						title: '建议增加快递存放点',
						date: '2025-06-28',
						status: '已处理'
					}
				]
			};
		},
		methods: {
			// 保存信息按钮点击事件
			saveInfo() {
				// 在这里可以进行表单验证
				if (!this.userInfo.phone || !this.userInfo.name || !this.userInfo.address) {
					uni.showToast({
						title: '请填写完整的居民信息',
						icon: 'none'
					});
					return;
				}
				console.log('保存的用户信息:', this.userInfo);
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
			},
			// 点击历史记录项，跳转到B二级界面（详情页）
			viewHistoryDetail(item) {
		
		
		
			}
		}
	}
</script>

<style>
	.page-container {
		background-color: #f4f4f4;
		min-height: 100vh;
		padding: 20rpx;
	}

	.section-card {
		background-color: #ffffff;
		padding: 30rpx;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 34rpx;
		font-weight: bold;
		margin-bottom: 30rpx;
	}

	.form-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.item-label {
		width: 180rpx;
		font-size: 30rpx;
	}

	.item-input {
		flex: 1;
		font-size: 30rpx;
	}
	
	.save-btn {
		background-color: #007AFF;
		color: white;
		margin-top: 30rpx;
		font-size: 32rpx;
	}
	
	.save-btn:active {
		background-color: #0056b3;
	}
	
	.empty-history {
		text-align: center;
		color: #999;
		padding: 40rpx 0;
	}

	.history-item {
		display: flex;
		align-items: center;
		padding: 25rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.history-item:last-child {
		border-bottom: none;
	}
	
	.history-item:active {
		background-color: #fafafa;
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.item-title {
		font-size: 30rpx;
		color: #333;
		margin-bottom: 5rpx;
	}

	.item-date {
		font-size: 24rpx;
		color: #999;
	}

	.item-status {
		font-size: 26rpx;
		color: #ff9900; /* 处理中状态颜色 */
		margin-right: 20rpx;
	}
	
	.status-processed {
		color: #4cd964; /* 已处理状态颜色 */
	}

	.item-arrow {
		font-size: 30rpx;
		color: #ccc;
	}
</style>