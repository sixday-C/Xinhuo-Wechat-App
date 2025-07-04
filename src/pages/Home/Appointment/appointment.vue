<template>
	<view class="page-container">
		<view class="schedule-layout">
			<scroll-view class="date-sidebar" scroll-y>
				<view
					v-for="(day, index) in schedule"
					:key="day.date"
					class="date-item"
					:class="{ 'active': activeDateIndex === index }"
					@click="selectDate(index)"
				>
					<view class="day-name">{{ day.dayName }}</view>
					<view class="date-number">{{ day.dateShort }}</view>
				</view>
			</scroll-view>
			
			<scroll-view class="time-slots-main" scroll-y>
				<view class="slot-header">
					请选择预约时段
					<view class="selected-date-display">{{ schedule[activeDateIndex]?.fullDate || '' }}</view>
				</view>
				<view class="slots-grid">
					<view
						v-for="slot in availableSlots"
						:key="slot.id"
						class="slot-item"
						:class="{ 
							'full': slot.status === 'full',
							'selected': selectedSlotId === slot.id
						}"
						@click="selectSlot(slot)"
					>
						{{ slot.time }}
						<view class="slot-status">{{ slot.status === 'full' ? '已约满' : '可预约' }}</view>
					</view>
				</view>
				<view v-if="availableSlots.length === 0" class="no-slots">
					当日无可用时段
				</view>
			</scroll-view>
		</view>
		
		<view class="footer">
			<button class="confirm-btn" :disabled="!selectedSlotId" @click="confirmBooking">确认预约</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				schedule: [], // 存储所有排班的数组
				activeDateIndex: 0, // 当前选中的日期索引
				selectedSlotId: null, // 当前选中的时段ID
			};
		},
		computed: {
			// 计算属性：根据选中的日期，返回对应的可用时段列表
			availableSlots() {
				if (this.schedule.length > 0) {
					return this.schedule[this.activeDateIndex].slots;
				}
				return [];
			}
		},
		onLoad() {
			// 页面加载时，生成并加载模拟的排班数据
			this.generateScheduleData();
		},
		methods: {
			// 生成未来7天的模拟排班数据
			generateScheduleData() {
				let scheduleData = [];
				const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
				const dayNames = ['今天', '明天', '后天'];
				
				for (let i = 0; i < 7; i++) {
					const date = new Date();
					date.setDate(date.getDate() + i);
					
					let dayName = dayNames[i] || weekDays[date.getDay()];
					
					scheduleData.push({
						dayName: dayName,
						dateShort: `${date.getMonth() + 1}/${date.getDate()}`,
						fullDate: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
						// 模拟不同日期的不同时段和状态
						slots: [
							{ id: `${i}-1`, time: '09:00-10:00', status: Math.random() > 0.3 ? 'available' : 'full' },
							{ id: `${i}-2`, time: '10:00-11:00', status: Math.random() > 0.5 ? 'available' : 'full' },
							{ id: `${i}-3`, time: '14:00-15:00', status: i % 2 === 0 ? 'available' : 'full' }, // 偶数日此时间段开放
							{ id: `${i}-4`, time: '15:00-16:00', status: 'available' },
						]
					});
				}
				this.schedule = scheduleData;
			},
			// 点击左侧日期项
			selectDate(index) {
				this.activeDateIndex = index;
				this.selectedSlotId = null; // 切换日期时，重置已选时段
			},
			// 点击右侧时段项
			selectSlot(slot) {
				if (slot.status === 'full') {
					uni.showToast({
						title: '该时段已约满',
						icon: 'none'
					});
					return;
				}
				this.selectedSlotId = slot.id;
			},
			// 点击确认预约按钮
			confirmBooking() {
				const selectedDate = this.schedule[this.activeDateIndex];
				const selectedSlot = this.availableSlots.find(s => s.id === this.selectedSlotId);
				
				uni.showModal({
					title: '确认预约信息',
					content: `您选择的预约时间为：\n${selectedDate.fullDate} ${selectedSlot.time}`,
					success: (res) => {
						if (res.confirm) {
							console.log('用户点击了确认');
							// 在这里执行提交预约到服务器的逻辑
							uni.showToast({ title: '预约成功！', icon: 'success' });
						}
					}
				});
			}
		}
	}
</script>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.schedule-layout {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	/* 左侧日期选择栏 */
	.date-sidebar {
		width: 200rpx;
		background-color: #f4f4f4;
		height: 100%;
	}
	
	.date-item {
		padding: 30rpx 10rpx;
		text-align: center;
		border-bottom: 1px solid #e8e8e8;
		transition: background-color 0.2s;
	}
	
	.date-item.active {
		background-color: #ffffff;
		font-weight: bold;
	}

	.day-name {
		font-size: 28rpx;
		color: #333;
	}
	
	.date-number {
		font-size: 24rpx;
		color: #666;
	}
	
	.date-item.active .day-name, .date-item.active .date-number {
		color: #007AFF;
	}

	/* 右侧时段选择区 */
	.time-slots-main {
		flex: 1;
		background-color: #ffffff;
		padding: 20rpx;
		box-sizing: border-box;
		height: 100%;
	}
	
	.slot-header {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		text-align: center;
	}
	
	.selected-date-display {
		font-size: 24rpx;
		color: #666;
		font-weight: normal;
		margin-top: 5rpx;
	}

	.slots-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}
	
	.no-slots {
		text-align: center;
		color: #999;
		padding-top: 100rpx;
	}

	.slot-item {
		padding: 20rpx;
		border: 1px solid #e0e0e0;
		border-radius: 12rpx;
		text-align: center;
		font-size: 28rpx;
		transition: all 0.2s;
	}
	
	.slot-status {
		font-size: 22rpx;
		margin-top: 5rpx;
	}

	.slot-item:not(.full) {
		cursor: pointer;
	}

	.slot-item.full {
		background-color: #f8f8f8;
		color: #b0b0b0;
		border-color: #f0f0f0;
	}

	.slot-item.selected {
		background-color: #007AFF;
		color: white;
		border-color: #007AFF;
		font-weight: bold;
	}

	/* 底部确认按钮 */
	.footer {
		padding: 20rpx;
		background-color: #ffffff;
		border-top: 1px solid #f0f0f0;
	}

	.confirm-btn {
		background-color: #007AFF;
		color: white;
		border-radius: 50rpx;
	}

	.confirm-btn[disabled] {
		background-color: #c8c7cc;
		color: #ffffff;
	}
</style>