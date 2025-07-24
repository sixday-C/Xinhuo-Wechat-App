<template>
  <view class="feedback-list">
    <!-- 状态提示 -->
    <view v-if="loading" class="status">
      <view class="spinner"></view>
      <text class="status-text">加载中…</text>
    </view>
    <view v-else-if="error" class="status error">
      <text class="status-text">{{ error }}</text>
      <button class="btn-retry" @click="fetchReports">重试</button>
    </view>

    <!-- 列表区域 -->
    <view v-else>
      <view v-if="reportList.length === 0" class="empty">
        <text>暂无反馈</text>
      </view>
      <view v-else class="grid">
        <view
          v-for="report in pagedReports"
          :key="report._id"
          class="card"
        >
          <view class="color-bar"></view>
          <view class="card-content">
            <view class="header">
              <text class="name">反馈人：{{ report.userName }}</text>
              <text class="time">{{ formatTime(report.reportTime) }}</text>
            </view>
            <view class="row"><text class="label">电话：</text><text class="value">{{ report.userPhone }}</text></view>
            <view class="row"><text class="label">地址：</text><text class="value">{{ report.userAddress }}</text></view>
            <view class="row desc"><text class="label">描述：</text><text class="value">{{ report.description }}</text></view>
            
			<view v-if="report.tempImageUrls.length" class="images">
			             <image
			               v-for="(url, i) in report.tempImageUrls"
			               :key="i"
			               :src="url"
			               class="img"
			               mode="aspectFill"
			               @click="previewImage(report.tempImageUrls, i)"
			             />
			           </view>
            <view class="status-and-actions">
              <text class="status-label">当前状态：{{ report.status }}</text>
              <view class="actions">
                <button class="btn accept" @click="updateStatus(report._id, '处理中')">已受理</button>
                <button class="btn resolve" @click="updateStatus(report._id, '已处理')">已解决</button>
              </view>
            </view>

            <view class="notes-section">
              <textarea
                v-model="report.processingNotesLocal"
                class="notes-input"
                placeholder="请输入物业备注"
              />
              <button class="btn-note" @click="updateNotes(report._id, report.processingNotesLocal)">
                提交备注
              </button>
            </view>
            <view v-if="report.processingNotesLocal" class="saved-notes">
              <text class="saved-label">物业备注：</text>
              <text class="saved-value">{{ report.processingNotesLocal }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 分页 -->
      <view class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
        <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      reportList: [],
      loading: false,
      error: '',
      currentPage: 1,
      pageSize: 4
    };
  },
  computed: {
    sortedReports() {
      return [...this.reportList].sort((a, b) => new Date(b.reportTime) - new Date(a.reportTime));
    },
    totalPages() {
      return Math.ceil(this.sortedReports.length / this.pageSize);
    },
    pagedReports() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.sortedReports.slice(start, start + this.pageSize);
    }
  },
  methods: {
    formatTime(ts) {
      return new Date(ts).toLocaleString();
    },
    async fetchReports() {
      this.loading = true; this.error = '';
      try {
        const db = uniCloud.database();
        const res = await db.collection('All_Report').get({ getUserInfo: false });
        this.reportList = res.result.data.map(item => ({
          ...item,
          status: item.status || '新提交',
          processingNotesLocal: item.processingNotes || '',
          tempImageUrls: Array.isArray(item.imageUrls)
            ? item.imageUrls.map(id => id.replace('cloud://env-00jxtsjrq0f2', 'https://env-00jxtsjrq0f2.normal.cloudstatic.cn'))
            : []
        }));
        this.currentPage = 1;
      } catch (e) {
        this.error = e.message || '获取失败';
      } finally {
        this.loading = false;
      }
    },
    changePage(p) {
      if (p < 1 || p > this.totalPages) return;
      this.currentPage = p;
    },
    async updateStatus(id, status) {
      this.loading = true;
      try {
        const db = uniCloud.database();
        await db.collection('All_Report').doc(id).update({ status });
        const idx = this.reportList.findIndex(r => r._id === id);
        this.$set(this.reportList[idx], 'status', status);
        uni.showToast({ title: `已标记为 ${status}`, icon: 'success' });
      } catch {
        uni.showToast({ title: '操作失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
	   previewImage(list, index) {
	    uni.previewImage({
	      urls: list,
	      current: list[index]
	    });
	   },
    async updateNotes(id, notes) {
      if (!notes.trim()) {
        uni.showToast({ title: '备注不能为空', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const db = uniCloud.database();
        await db.collection('All_Report').doc(id).update({ processingNotes: notes });
        const idx = this.reportList.findIndex(r => r._id === id);
        this.$set(this.reportList[idx], 'processingNotesLocal', notes);
        uni.showToast({ title: '备注已保存', icon: 'success' });
      } catch {
        uni.showToast({ title: '保存失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    }
  },
  onLoad() {
    this.fetchReports();
  }
};
</script>

<style scoped>
.feedback-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #f0f2f5;
}
.status {
  display: flex; flex-direction: column; align-items: center; margin: 80px 0;
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid #e0e0e0; border-top-color: #409eff;
  border-radius: 50%; animation: spin 1s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.status-text { font-size: 14px; color: #666; }
.status.error .status-text { color: #f56c6c; }
.btn-retry { margin-top: 12px; padding: 8px 16px; background: #409eff; color: #fff; border-radius: 4px; }

/* 网格布局：auto-fit + minmax 保证大屏两列，中屏一列 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
.card {
  display: flex;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.color-bar { width: 6px; background: #409eff; }
.card-content { flex: 1; padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: baseline; }
.name { font-size: 18px; font-weight: bold; color: #333; }
.time { font-size: 12px; color: #999; }
.row { display: flex; margin-top: 12px; }
.label { width: 80px; font-size: 14px; color: #666; }
.value { flex: 1; font-size: 14px; color: #333; }
.desc .value { white-space: pre-wrap; line-height: 1.5; margin-top: 4px; }
.images { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.img { width: 150px; height: 150px; border-radius: 4px; object-fit: cover; background: #fafafa; }

.status-and-actions {
  display: flex; justify-content: space-between; align-items: center; margin-top: 16px;
}
.status-label { font-size: 14px; color: #666; }
.actions { display: flex; gap: 12px; }
.btn { padding: 8px 14px; border: none; border-radius: 4px; color: #fff; font-size: 14px; }
.accept { background: #ff9800; }
.resolve { background: #4caf50; }

.notes-section {
  display: flex; gap: 12px; margin-top: 16px;
}
.notes-input {
  flex: 1; min-height: 100px; padding: 10px; border: 1px solid #ddd;
  border-radius: 4px; font-size: 14px; resize: vertical;
}
.btn-note { height: 10%; padding: 8px 11px;background: #409eff; color: #fff; border-radius: 4px;}

.saved-notes {
  margin-top: 10px; gap: 8px;flex:none;
}
.saved-label { font-size: 14px; color: #909399; }
.saved-value { font-size: 14px; color: #333; }

/* 分页 */
.pagination {
  display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px;
}
.page-btn {
  padding: 8px 14px; background: #409eff; color: #fff; border: none; border-radius: 4px;
}
.page-btn:disabled { background: #ccc; cursor: not-allowed; }
.page-info { font-size: 14px; color: #333; }

/* 空状态 */
.empty { text-align: center; color: #999; margin: 100px 0; }

/* 响应小屏再微调 */
@media (max-width: 600px) {
  .card-content { padding: 16px; }
  .label { width: 70px; }
}
</style>
