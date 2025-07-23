<template>
  <unicloud-db v-slot:default="{data, loading, error, options}" :collection="collection" :options="formData"
               :getone="true" :where="where" :manual="true" ref="detail" foreignKey="uni-cms-articles.user_id"
               @load="loadData"
               class="article">
    <template v-if="!loading && data">
      <view class="meta">
        <view class="title">
          <text class="text">{{ data.title }}</text>
        </view>
        <view class="excerpt">
          <text class="text">{{ data.excerpt }}</text>
        </view>
        <view class="author">
          <template v-if="data.user_id[0]">
            <text class="at">{{ data.user_id[0].nickname || '' }}</text>
            <text class="split">·</text>
          </template>
          <text class="date">{{ publishTime(data.publish_date) }}</text>
        </view>
      </view>
      <render-article-detail
        :content="data.content"
        :content-images="data.content_images"
        :ad-config="{ adpId, watchAdUniqueType }"
      ></render-article-detail>
    </template>
    <view class="detail-loading" v-else>
      <uni-icons type="spinner-cycle" size="35px"/>
    </view>
  </unicloud-db>
</template>

<script>
import uniNavBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue';
import renderArticleDetail from "@/uni_modules/uni-cms-article/components/render-article-detail/index.vue";
import translatePublishTime from "@/uni_modules/uni-cms-article/common/publish-time";

const db = uniCloud.database()
const articleDBName = 'uni-cms-articles'
const userDBName = 'uni-id-users'

export default {
  components: {
    uniNavBar,
    renderArticleDetail
  },
  data() {
    return {
      id: "", // 文章ID
      title: "", // 文章标题
      formData: {}, // 表单数据

      // 广告相关配置
      adpId: "", // TODO: 请填写广告位ID
      watchAdUniqueType: "device" // TODO: 观看广告的唯一标识类型，可选值为 user 或者 device，user 表示用户唯一，device 表示设备唯一
    }
  },
  computed: {
    where() {
      //拼接where条件 查询条件 ,更多详见 ：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db?id=jsquery
      return `_id =="${this.id}"`
    },
    collection() {
      return [
        db.collection(articleDBName).where(this.where).field('user_id,thumbnail,excerpt,publish_date,title,content').getTemp(),
        db.collection(userDBName).field('_id, nickname').getTemp()
      ]
    }
  },
  onReady() {
    // 开始加载数据，修改 where 条件后才开始去加载 clinetDB 的数据 ，需要等组件渲染完毕后才开始执行 loadData，所以不能再 onLoad 中执行
    if (this.id) { // ID 不为空，则发起查询
      this.$refs.detail.loadData()
    } else {
      uni.showToast({
        icon: 'none',
        title: 'id 不能为空'
      })
    }
  },
  onLoad(event) {
    //获取文章id，通常 id 来自上一个页面
    if (event.id) {
      this.id = event.id
    }

    // 监听解锁内容事件
    uni.$on('onUnlockContent', this.onUnlockContent)
  },
  onUnload() {
    // 页面卸载时，移除监听事件
    uni.$off('onUnlockContent', this.onUnlockContent)
  },
  onPageScroll(e) {
    // 根据滚动位置判断是否显示导航栏
    if (e.scrollTop > 100) {
      uni.setNavigationBarTitle({
        title: this.title
      })
    } else {
      uni.setNavigationBarTitle({
        title: ''
      })
    }
  },
  methods: {
    // 将时间戳转换为可读的时间格式
    publishTime(timestamp) {
      return translatePublishTime(timestamp)
    },
    // 将文章加入阅读历史
    setReadHistory() {
      // 获取阅读历史缓存，如果不存在则为空数组
      const historyCache = uni.getStorageSync('readHistory') || []
      // 过滤掉当前文章的阅读历史
      const readHistory = historyCache.filter(item => item.article_id !== this.id)
      // 将当前文章的阅读历史添加到数组最前面
      readHistory.unshift({
        article_id: this.id,
        last_time: Date.now()
      })
      // 将更新后的阅读历史缓存到本地
      uni.setStorageSync('readHistory', readHistory)

    },
    // 加载数据
    loadData(data) {
      // 设置文章标题
      this.title = data.title

      // 将文章添加进阅读历史
      this.setReadHistory()
    },
    // 监听解锁内容事件，解锁内容后重新加载数据
    async onUnlockContent() {
      this.$refs.detail.loadData()
    }
  }

}
</script>

<style scoped lang="scss">
/* #ifdef APP-NVUE */
.article {
  background-color: #fff;
}

/* #endif */

@mixin cp {
  padding: 0 30rpx;
}

.detail-loading {
  margin: 100rpx auto 0;
  width: 35px;
  height: 35px;
  animation: rotate360 2s linear infinite;
}

@keyframes rotate360 {
  0% {
    transform: rotate(0deg);
    transform-origin: center center;
  }

  100% {
    transform: rotate(360deg);
    transform-origin: center center;
  }
}

.meta {
  @include cp;
  position: relative;
  z-index: 1;
  padding-top: 20rpx;
  .title {
    .text {
      font-size: 40rpx;
      line-height: 66rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .excerpt {
    margin-top: 10rpx;
    .text {
      font-size: 26rpx;
      line-height: 40rpx;
      color: #999;
    }
  }

  .author {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    margin-top: 20rpx;

    .at,
    .split,
    .date {
      font-size: 26rpx;
      color: #ccc;
    }

    .split {
      margin: 0 10rpx;
    }
  }
}
</style>
