<template>
  <view class="user-list-container">
    <!-- 总数展示 -->
    <view class="count-container">
      <text class="count-text">共 {{ totalCount }} 位用户</text>
    </view>

    <view v-if="loading" class="status-container">
      <view class="spinner"></view>
      <text class="status-text">加载中…</text>
    </view>
    <view v-else-if="error" class="status-container error">
      <text class="status-text">{{ error }}</text>
      <button class="retry-btn" @click="fetchUsers">重试</button>
    </view>
    <view v-else>
      <view v-if="totalCount === 0" class="empty-container">
        <text class="empty-text">暂无用户</text>
      </view>
      <view v-else class="list-wrapper">
        <view
          v-for="user in pagedList"
          :key="user._id"
          class="user-card"
        >
          <view class="card-header">
            <text class="user-name">用户姓名：{{ user.name }}</text>
          </view>
          <view class="card-body">
            <view class="info-item">
              <text class="label">电话：</text>
              <text class="value">{{ user.phone }}</text>
            </view>
            <view class="info-item">
              <text class="label">地址：</text>
              <text class="value">{{ user.address }}</text>
            </view>
          </view>
        </view>

        <!-- 分页控件 -->
        <view class="pagination">
          <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
            class="page-btn"
          >上一页</button>
          <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
          <button
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
            class="page-btn"
          >下一页</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userList: [],
      loading: false,
      error: '',
      currentPage: 1,
      pageSize: 12,  // 每页 4 行 * 3 列 = 12 条
      totalCount: 0
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCount / this.pageSize);
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.userList.slice(start, start + this.pageSize);
    }
  },
  async onLoad() {
    await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = '';
      try {
        const db = uniCloud.database();
        const res = await db
          .collection('demo-user')
          .get();
        this.userList = res.result.data;
        this.totalCount = this.userList.length;
        this.currentPage = 1;
      } catch (e) {
        console.error('获取用户列表失败:', e);
        this.error = e.message || '获取用户失败';
      } finally {
        this.loading = false;
      }
    },
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    }
  }
};
</script>

<style scoped>
.user-list-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.count-container {
  margin-bottom: 20px;
}
.count-text {
  font-size: 16px;
  color: #606266;
}
.status-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 100px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #409eff;
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
  background-color: #409eff;
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
  font-size: 18px;
  color: #999;
}
.list-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}
.user-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: calc(33.333% - 13.333px);
  box-sizing: border-box;
}
.card-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.user-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.card-body .info-item {
  display: flex;
  margin-top: 8px;
}
.label {
  font-size: 14px;
  color: #909399;
  width: 80px;
}
.value {
  font-size: 14px;
  color: #606266;
  flex: 1;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}
.page-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #409eff;
  color: #fff;
  cursor: pointer;
}
.page-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
.page-info {
  font-size: 14px;
  color: #606266;
}
@media (max-width: 992px) {
  .user-card {
    width: calc(50% - 10px);
  }
}
@media (max-width: 600px) {
  .user-card {
    width: 100%;
  }
}
</style>
