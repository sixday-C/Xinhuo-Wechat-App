<template>
  <view class="page-container">
    <view class="section-header">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>

    <view class="section-card">
      <view class="section-title">居民信息</view>
      <view class="info-form">
        <view class="form-item">
          <text class="item-label">手机号</text>
          <!-- 显示不可编辑的手机号 -->
          <text class="item-value">{{ userInfo.phone }}</text>
        </view>
        <view class="form-item">
          <text class="item-label">姓名</text>
          <input v-model.trim="userInfo.name" placeholder="请输入您的姓名" />
        </view>
        <view class="form-item">
          <text class="item-label">楼宇门牌</text>
          <input v-model.trim="userInfo.address" placeholder="例如：A栋1单元202" />
        </view>
      </view>
      <button class="save-btn" :loading="loading" @click="saveInfo">保存信息</button>
      <view v-if="result" class="result">
        <text :class="{'success': result.success, 'error': !result.success}">
          {{ result.message }}
        </text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-title">历史记录</view>
      <view class="history-list">
        <view v-if="historyList.length === 0" class="empty-history">
          <text>暂无上报记录</text>
        </view>
        <view v-for="item in historyList" :key="item.id" class="history-item" @click="viewHistoryDetail(item)">
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
      userInfo: { phone: '', name: '', address: '' },
      loading: false,
      result: null,
      historyList: []
    }
  },
  async onshow(){
	  await this.fetchUserInfo();
  },
  async onLoad() {
    // 未登录跳回登录页
    if (!uni.getStorageSync('is_logged_in')) {
      uni.reLaunch({ url: '/pages/Login/Login' });
      return;
    }
    
    await this.fetchHistory();
  },
  methods: {
    // 获取用户信息
    async fetchUserInfo() {
      const db = uniCloud.database();
      const userId = uni.getStorageSync('current_user_id');
      const { data } = await db.collection('demo-user').doc(userId).get();
      if (data.length > 0) {
        this.userInfo = data[0];
      }
    },
    // 获取历史记录（示例数据或改为动态获取）
    async fetchHistory() {
      // TODO: 根据需求查询历史上报记录
      this.historyList = [
        { id: '1001', title: '小区东门路灯不亮', date: '2025-07-02', status: '已处理', progress: 100 },
        { id: '1002', title: 'B栋电梯有异响', date: '2025-07-01', status: '处理中', progress: 50 }
      ];
    },
    // 更新用户信息（仅更新姓名和地址，不修改手机号）
    async saveInfo() {
      const { name, address } = this.userInfo;
      if (!name || !address) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const db = uniCloud.database();
        const userId = uni.getStorageSync('current_user_id');
        const { updated } = await db.collection('demo-user').doc(userId)
          .update({ name, address });
        if (updated > 0) {
          this.result = { success: true, message: '更新成功' };
        } else {
          this.result = { success: false, message: '未做任何修改' };
        }
      } catch (e) {
        this.result = { success: false, message: e.message };
      } finally {
        this.loading = false;
      }
    },
    // 退出登录
    logout() {
      uni.clearStorageSync();
      uni.reLaunch({ url: '/pages/Login/Login' });
    },
    viewHistoryDetail(item) {
      const params = {
        id: item.id,
        title: encodeURIComponent(item.title),
        date: item.date,
        status: item.status,
        progress: item.progress || 0,
        type: '设施维修',
        location: '小区公共区域'
      };
      const queryString = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      uni.navigateTo({ url: `/pages/Profile/history-detail?${queryString}` });
    }
  }
}
</script>

<style>
	.section-header { display: flex; justify-content: flex-end; padding: 20rpx; }
	.logout-btn { font-size: 28rpx; color: #007AFF; }
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

	.item-value {
		flex: 1;
		font-size: 30rpx;
		color: #333;
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

	/* 自定义进度条样式 */
	.progress-container {
		display: flex;
		align-items: center;
		margin-top: 10rpx;
		gap: 15rpx;
	}

	.progress-bar {
		flex: 1;
		height: 8rpx;
		background-color: #f0f0f0;
		border-radius: 4rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4rpx;
		transition: width 0.3s ease;
	}
</style>
