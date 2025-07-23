<template>
  <view class="page-container">
    <view class="schedule-layout">
      <!-- 日期侧边栏 -->
      <scroll-view class="date-sidebar" scroll-y>
        <view
          v-for="(day, index) in schedule"
          :key="day.date"
          class="date-item"
          :class="{ active: activeDateIndex === index }"
          @click="selectDate(index)"
        >
          <view class="day-name">{{ day.dayName }}</view>
          <view class="date-number">{{ day.dateShort }}</view>
        </view>
      </scroll-view>

      <!-- 时段主区域 -->
      <scroll-view class="time-slots-main" scroll-y>
        <view class="slot-header">
          请选择预约时段
          <view class="selected-date-display">
            {{ schedule[activeDateIndex]?.fullDate || '' }}
          </view>
        </view>
        <view class="slots-grid">
          <view
            v-for="slot in availableSlots"
            :key="slot.id"
            class="slot-item"
            :class="{
              full: isFull(slot),
              selected: selectedSlotId === slot.id
            }"
            @click="handleSlotClick(slot)"
          >
            <text class="slot-time">{{ slot.time }}</text>
            <view class="slot-status">
              <!-- 已满显示已约满，否则显示剩余名额 -->
              {{ isFull(slot) ? '已约满' : `剩余 ${5 - getCount(slot)} 位` }}
            </view>
          </view>
        </view>
        <view v-if="availableSlots.length === 0" class="no-slots">
          当日无可用时段
        </view>
      </scroll-view>
    </view>

    <!-- 底部按钮 -->
    <view class="footer">
      <button
        class="confirm-btn"
        :disabled="!selectedSlotId"
        @click="confirmBooking"
      >
        确认预约
      </button>
    </view>
  </view>
</template>

<script>
const bookingAPI = uniCloud.importObject('addBooking')
const getSlotCountsAPI = uniCloud.importObject('getSlotCounts')

export default {
  data() {
    return {
      schedule: [],
      activeDateIndex: 0,
      selectedSlotId: null,
      userInfo: { name: '', phone: '', address: '' },
      slotCounts: {}
    }
  },
  async onLoad() {
    this.generateScheduleData()
    this.loadUserInfo()
    await this.fetchSlotCounts()
  },
  computed: {
    availableSlots() {
      return this.schedule[this.activeDateIndex]?.slots || []
    }
  },
  methods: {
    loadUserInfo() {
      const info = uni.getStorageSync('userInfo') || {}
      this.userInfo = { name: info.name || '', phone: info.phone || '', address: info.address || '' }
    },
    generateScheduleData() {
      const weekDays = ['周日','周一','周二','周三','周四','周五','周六']
      const dayNames = ['今天','明天','后天']
      const data = []
      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        const dayName = dayNames[i] || weekDays[d.getDay()]
        data.push({
          dayName,
          dateShort: `${d.getMonth()+1}/${d.getDate()}`,
          fullDate: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`,
          slots: [
            { id: `${i}-1`, time: '09:00-10:00' },
            { id: `${i}-2`, time: '10:00-11:00' },
            { id: `${i}-3`, time: '14:00-15:00' },
            { id: `${i}-4`, time: '15:00-16:00' }
          ]
        })
      }
      this.schedule = data
    },
    selectDate(index) {
      this.activeDateIndex = index
      this.selectedSlotId = null
      this.fetchSlotCounts()
    },
    // 获取已约人数
    getCount(slot) {
      const date = this.schedule[this.activeDateIndex].fullDate
      const key = `${date}|${slot.time}`
      return this.slotCounts[key] || 0
    },
    // 判断是否已满
    isFull(slot) {
      return this.getCount(slot) >= 5
    },
    // 处理点击
    handleSlotClick(slot) {
      if (this.isFull(slot)) {
        uni.showToast({ title: '该时段已约满', icon: 'none' })
        return
      }
      this.selectedSlotId = slot.id
    },
    async fetchSlotCounts() {
      const dateList = this.schedule.map(d => d.fullDate)
      const resp = await getSlotCountsAPI.get({ dateList })
      if (resp.code === 200) {
        this.slotCounts = resp.data
      }
    },
    async confirmBooking() {
      const info = uni.getStorageSync('userInfo')
      if (!info?.phone || !info?.name || !info?.address) {
        uni.showToast({ title: '请先完善您的居民信息', icon: 'none' })
        return uni.switchTab({ url: '/pages/Profile/profile' })
      }
      const { name, phone, address } = info
      const appointmentDate = this.schedule[this.activeDateIndex].fullDate
      const timeSlot = this.schedule[this.activeDateIndex].slots.find(s => s.id === this.selectedSlotId).time

      try {
        const resp = await bookingAPI.addBooking({ name, phone, address, appointmentDate, timeSlot })
        if (resp.code === 200) {
          uni.showToast({ title: '预约成功！', icon: 'success' })
          await this.fetchSlotCounts()
        } else {
          uni.showToast({ title: resp.message, icon: 'none' })
        }
      } catch (err) {
        uni.showToast({ title: err.message || '预约失败', icon: 'none' })
      }
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