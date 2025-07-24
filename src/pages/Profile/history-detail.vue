<template>
	<view class="detail-container">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 头部信息卡片 -->
		<view v-else class="header-card">
			<view class="status-badge" :class="{'badge-processed': detail.status === '已处理'}">
				{{ detail.status }}
			</view>
			<text class="detail-title">{{ detail.title }}</text>
			<text class="detail-date">上报时间：{{ detail.createTime || detail.date }}</text>
			
			<!-- 进度条 -->
			<view class="progress-section">
				<text class="progress-label">处理进度</text>
				<view class="progress-container">
					<view class="progress-bar">
						<view class="progress-fill" :style="{
							width: detail.progress + '%', 
							backgroundColor: getProgressColor(detail.status)
						}"></view>
					</view>
					<!-- 百分比数字已移除 -->
				</view>
			</view>
		</view>

		<!-- 详细信息卡片 -->
		<view class="info-card">
			<view class="card-title">详细信息</view>
			<view class="info-item">
				<text class="info-label">事务类型</text>
				<text class="info-value">{{ detail.category || '设施维修' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">上报地址</text>
				<text class="info-value">{{ detail.locationInfo?.address || detail.userAddress || '小区公共区域' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">问题描述</text>
				<text class="info-value">{{ detail.description || '具体问题描述内容...' }}</text>
			</view>
			<!-- 处理备注信息 -->
			<view v-if="detail.processingNotes" class="info-item processing-notes">
				<text class="info-label">处理备注</text>
				<text class="info-value notes-text">{{ detail.processingNotes }}</text>
			</view>
		</view>
		<!-- 图片展示区域 -->
		<view v-if="detail.imageUrls && detail.imageUrls.length > 0" class="detail-images">
			<view class="image-list">
				<image
					v-for="(img, idx) in detail.imageUrls"
					:key="idx"
					:src="img"
					class="detail-image"
					mode="aspectFill"
					@click="previewImage(idx)"
				/>
			</view>
		</view>

		<!-- 处理时间线 -->
		<view class="timeline-card">
			<view class="card-title">处理进度</view>
			<view class="timeline">
				<view class="timeline-item" v-for="(step, index) in timelineSteps" :key="index" 
					  :class="{'timeline-active': step.completed, 'timeline-current': step.current}">
					<view class="timeline-dot"></view>
					<view class="timeline-content">
						<text class="timeline-title">{{ step.title }}</text>
						<text class="timeline-time">{{ step.time }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-section">
			<button class="action-btn secondary" @click="goBack">返回列表</button>
			<button class="action-btn primary" @click="contactService" v-if="detail.status === '处理中'">联系客服</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			detail: {},
			timelineSteps: [],
			loading: true
		}
	},
	onLoad(options) {
		this.recordId = options.id;
		this.recordType = options.type || 'report';
		
		if (this.recordType === 'report') {
			this.loadReportDetail();
		} else {
			// 如果是预约类型，使用原有的静态数据逻辑
			this.loadAppointmentDetail(options);
		}
	},
	methods: {
		// 根据状态获取进度条颜色
		getProgressColor(status) {
			if (status === '已处理') {
				return '#4cd964';
			} else if (status === '处理中') {
				return '#ff9900';
			}
			return '#007AFF';
		},
		
		// 加载问题上报详情
		async loadReportDetail() {
			try {
				const getReportDetail = uniCloud.importObject('getReportDetail');
				const response = await getReportDetail.getReportDetail({
					id: this.recordId
				});

				if (response.code === 200 && response.data) {
					this.detail = response.data;
					this.timelineSteps = response.data.timeline || [];
				} else {
					uni.showToast({
						title: response.message || '获取详情失败',
						icon: 'none'
					});
					// 设置默认数据防止页面崩溃
					this.setDefaultDetail();
				}
			} catch (e) {
				console.error('获取详情异常：', e);
				uni.showToast({
					title: '网络异常，请稍后重试',
					icon: 'none'
				});
				this.setDefaultDetail();
			} finally {
				this.loading = false;
			}
		},

		// 加载预约详情（使用原有逻辑）
		loadAppointmentDetail(options) {
			this.detail = {
				id: options.id,
				title: decodeURIComponent(options.title || ''),
				createTime: options.date || '',
				status: options.status || '',
				progress: parseInt(options.progress || '0'),
				category: options.type || '线下预约',
				locationInfo: { address: options.location || '社区服务中心' },
				description: options.description || '线下预约服务'
			};
			
			this.generateTimeline();
			this.loading = false;
		},

		// 设置默认详情数据
		setDefaultDetail() {
			this.detail = {
				id: this.recordId,
				title: '数据加载失败',
				description: '无法获取详细信息',
				status: '未知',
				progress: 0,
				category: '其他问题',
				createTime: '',
				locationInfo: { address: '未知' },
				timeline: []
			};
			this.timelineSteps = [];
		},

		// 生成时间线（用于预约类型）
		generateTimeline() {
			if (this.detail.status === '已处理') {
				this.timelineSteps = [
					{
						title: '问题上报',
						time: this.detail.createTime,
						completed: true,
						current: false
					},
					{
						title: '受理确认',
						time: this.getNextDay(this.detail.createTime, 1),
						completed: true,
						current: false
					},
					{
						title: '处理中',
						time: this.getNextDay(this.detail.createTime, 2),
						completed: true,
						current: false
					},
					{
						title: '处理完成',
						time: this.getNextDay(this.detail.createTime, 3),
						completed: true,
						current: false
					}
				];
			} else {
				this.timelineSteps = [
					{
						title: '问题上报',
						time: this.detail.createTime,
						completed: true,
						current: false
					},
					{
						title: '受理确认',
						time: this.getNextDay(this.detail.createTime, 1),
						completed: true,
						current: false
					},
					{
						title: '处理中',
						time: this.getNextDay(this.detail.createTime, 2),
						completed: false,
						current: true
					},
					{
						title: '待处理完成',
						time: '预计' + this.getNextDay(this.detail.createTime, 5),
						completed: false,
						current: false
					}
				];
			}
		},
		
		// 获取下一天日期（简单实现）
		getNextDay(dateStr, days) {
			const date = new Date(dateStr);
			date.setDate(date.getDate() + days);
			return date.toISOString().split('T')[0];
		},
		
		// 返回列表
		goBack() {
			uni.navigateBack();
		},
		
		// 联系客服
		contactService() {
			uni.showToast({
				title: '正在为您接通客服',
				icon: 'none'
			});
		},

		// 预览图片
		previewImage(idx) {
			uni.previewImage({
				current: this.detail.imageUrls[idx],
				urls: this.detail.imageUrls
			});
		}
	}
}
</script>

<style>
.detail-container {
	background-color: #f4f4f4;
	min-height: 100vh;
	padding: 20rpx;
}

/* 头部信息卡片 */
.header-card {
	background-color: #ffffff;
	padding: 40rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	position: relative;
}

.status-badge {
	position: absolute;
	top: 20rpx;
	right: 20rpx;
	background-color: #ff9900;
	color: white;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
}

.badge-processed {
	background-color: #4cd964;
}

.detail-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 20rpx;
	padding-right: 120rpx;
}

.detail-date {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 40rpx;
}

/* 进度条部分 */
.progress-section {
	margin-top: 30rpx;
}

.progress-label {
	font-size: 30rpx;
	color: #333;
	font-weight: bold;
	display: block;
	margin-bottom: 20rpx;
}

.progress-container {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.progress-bar {
	flex: 1;
	height: 12rpx;
	background-color: #f0f0f0;
	border-radius: 6rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	border-radius: 6rpx;
	transition: width 0.3s ease;
}

/* 信息卡片 */
.info-card, .timeline-card {
	background-color: #ffffff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.info-item {
	display: flex;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f8f8f8;
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	width: 160rpx;
	font-size: 28rpx;
	color: #666;
	flex-shrink: 0;
}

.info-value {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	line-height: 1.5;
}

/* 时间线 */
.timeline {
	position: relative;
}

.timeline-item {
	display: flex;
	margin-bottom: 40rpx;
	position: relative;
}

.timeline-item:last-child {
	margin-bottom: 0;
}

.timeline-item::before {
	content: '';
	position: absolute;
	left: 12rpx;
	top: 40rpx;
	width: 2rpx;
	height: 60rpx;
	background-color: #e0e0e0;
}

.timeline-item:last-child::before {
	display: none;
}

.timeline-dot {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background-color: #e0e0e0;
	margin-right: 30rpx;
	margin-top: 10rpx;
	flex-shrink: 0;
}

.timeline-active .timeline-dot {
	background-color: #4cd964;
}

.timeline-current .timeline-dot {
	background-color: #ff9900;
	box-shadow: 0 0 0 4rpx rgba(255, 153, 0, 0.2);
}

.timeline-content {
	flex: 1;
}

.timeline-title {
	font-size: 30rpx;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.timeline-active .timeline-title {
	font-weight: bold;
}

.timeline-time {
	font-size: 24rpx;
	color: #999;
}

/* 操作按钮 */
.action-section {
	display: flex;
	gap: 20rpx;
	margin-top: 40rpx;
	margin-bottom: 40rpx;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
}

.action-btn.secondary {
	background-color: #f8f8f8;
	color: #666;
}

.action-btn.primary {
	background-color: #007AFF;
	color: white;
}

.action-btn:active {
	opacity: 0.8;
}

/* 加载状态 */
.loading-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 400rpx;
}

.loading-text {
	font-size: 32rpx;
	color: #666;
}

/* 图片展示区域 */
.detail-images {
	margin: 20rpx 0;
}
.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}
.detail-image {
	width: 180rpx;
	height: 180rpx;
	border-radius: 8rpx;
	object-fit: cover;
}

/* 处理备注样式 */
.processing-notes {
	background-color: #f8f9fa;
	border-left: 4rpx solid #4cd964;
	margin: 20rpx -10rpx;
	padding: 20rpx 15rpx;
	border-radius: 8rpx;
}

.notes-text {
	color: #2c3e50;
	font-weight: 500;
	line-height: 1.6;
}
</style> 