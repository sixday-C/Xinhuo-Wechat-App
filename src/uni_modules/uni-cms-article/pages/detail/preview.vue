<template>
  <unicloud-db v-slot:default="{loading, error, options}" :collection="collection" :options="formData"
               :getone="true" :where="where" :manual="true" ref="detail" foreignKey="uni-cms-articles.user_id"
               @load="loadData"
               class="article">
    <template v-if="!loading && articleData">
      <view class="preview-tip">此页面仅用于临时预览文章，链接将会在短期内失效。</view>
      <view class="meta">
        <view class="title">
          <text class="text">{{ articleData.title }}</text>
        </view>
        <view class="excerpt">
          <text class="text">{{ articleData.excerpt }}</text>
        </view>
        <view class="author">
          <template v-if="articleData.user_id && articleData.user_id[0]">
            <text class="at">{{ articleData.user_id[0].nickname || '' }}</text>
            <text class="split">·</text>
          </template>
          <text class="date">{{ publishTime(articleData.publish_date) }}</text>
        </view>
      </view>
      <render-article-detail
        :content="articleData.content"
        :content-images="articleData.content_images"
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
      secret: "", // 文章预览密钥
      formData: {}, // 表单数据
      articleData: null, // 文章数据

      // 广告相关配置
      adpId: "", // TODO: 请填写广告位ID
      watchAdUniqueType: "device" // TODO: 观看广告的唯一标识类型，可选值为 user 或者 device，user 表示用户唯一，device 表示设备唯一
    }
  },
  computed: {
    where() {
      //拼接where条件 查询条件 ,更多详见 ：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db?id=jsquery
      return `_id =="${this.id}" && preview_secret =="${this.secret}"`
    },
    collection() {
      return [
        db.collection(articleDBName).where(this.where).field('user_id,thumbnail,excerpt,publish_date,title,content,preview_secret,preview_expired,article_status').getTemp(),
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
      this.secret = event.secret
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
    // 加载数据
    loadData(data) {
      if (!data) {
        return uni.showModal({
          content: "文章不存在/预览密钥不存在",
          showCancel: false,
          success: () => {
            // #ifdef H5
            window.close()
            // #endif

            // #ifndef H5
            uni.navigateBack()
            // #endif
          }
        })
      }
      // 文章已发布，跳转到文章详情页
      if (data.article_status === 1) {
        uni.showToast({
          icon: 'none',
          title: '文章已发布'
        })
        uni.redirectTo({
          url: `/uni_modules/uni-cms-article/pages/detail/detail?id=${this.id}`
        })
        return
      }

      // 预览已过期，提示用户
      if (data.preview_expired < Date.now()) {
        return uni.showModal({
          content: "预览已失效",
          showCancel: false,
          success: () => {
            // #ifdef H5
              window.close()
            // #endif

            // #ifndef H5
              uni.navigateBack()
            // #endif
          }
        })
      }

      // 设置文章标题
      this.title = data.title
      this.articleData = data
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

.preview-tip {
  font-size: 13px;
  color: #333;
  background: #fcd791;
  padding: 10px;
}
</style>
