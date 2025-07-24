<template>
  <view class="booking-list-container">
    <!-- 总数 & 列表头 -->
    <view class="header">
      <text class="title">预约列表（共 {{ totalCount }} 条）</text>
    </view>

    <view v-if="loading" class="status-container">
      <view class="spinner"></view>
      <text class="status-text">加载中…</text>
    </view>
    <view v-else-if="error" class="status-container error">
      <text class="status-text">{{ error }}</text>
      <button class="retry-btn" @click="fetchBookings">重试</button>
    </view>
    <view v-else>
      <view v-if="totalCount === 0" class="empty-container">
        <text class="empty-text">暂无预约</text>
      </view>
      <view v-else class="list-wrapper">
        <view
          v-for="item in sortedList"
          :key="item._id"
          class="booking-card"
        >
          <view class="card-header">
            <text class="name">预约人：{{ item.name }}</text>
            <text class="date">{{ item.appointmentDate }}</text>
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="label">电话：</text>
              <text class="value">{{ item.phone }}</text>
            </view>
            <view class="info-row">
              <text class="label">地址：</text>
              <text class="value">{{ item.address }}</text>
            </view>
            <view class="info-row">
              <text class="label">时段：</text>
              <text class="value">{{ item.timeSlot }}</text>
            </view>
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
      bookingList: [],
      loading: false,
      error: '',
      totalCount: 0
    };
  },
  computed: {
    sortedList() {
      return this.bookingList
        .slice()
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    }
  },
  async onLoad() {
    await this.fetchBookings();
  },
  methods: {
    async fetchBookings() {
      this.loading = true;
      this.error = '';
      try {
        const db = uniCloud.database();
        const res = await db.collection('booking').get();
        this.bookingList = res.result.data;
        this.totalCount = this.bookingList.length;
      } catch (e) {
        console.error('获取预约列表失败:', e);
        this.error = e.message || '获取预约失败';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.booking-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
}
.header {
  margin-bottom: 20px;
}
.title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.status-text {
  font-size: 14px;
  color: #666;
}
.error .status-text {
  color: #f56c6c;
}
.retry-btn {
  margin-top: 10px;
  padding: 6px 20px;
  background-color: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 100px;
}
.empty-text {
  font-size: 16px;
  color: #999;
}
.list-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.booking-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}
.card-header {
  background-color: #42b983;
  color: #fff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.name {
  font-size: 16px;
  font-weight: bold;
}
.date {
  font-size: 14px;
}
.card-body {
  padding: 10px;
}
.info-row {
  display: flex;
  margin-top: 8px;
}
.label {
  width: 60px;
  font-size: 14px;
  color: #909399;
}
.value {
  flex: 1;
  font-size: 14px;
  color: #606266;
}
@media (max-width: 992px) {
  .list-wrapper {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .list-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
