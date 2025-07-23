<template>
  <unicloud-db
    ref='udb'
    v-slot:default="{ data, pagination, hasMore, loading, error }"
    :collection="collectionList"
    :page-size="10"
    :loadtime="loadTime"
    orderby="publish_date desc"
    @load="onListLoad"
    @error="onListLoadError"
  >
    <view
      v-if="networkType == 'none'"
      class="error-box"
      @click="checkNetwork"
    >
      <image class="disconnect-icon" src="/uni_modules/uni-cms-article/static/disconnection.png" mode="widthFix"></image>
      <text class="tip-text">当前网络不可用，请点击重试</text>
    </view>
    <list-view
      v-else
      class="list-view"
      :scroll-y="true"
      :refresher-enabled="refresherEnabled"
      refresher-default-style="none"
      :refresher-triggered="refresherTriggered"
      @refresherpulling="refresherpulling"
      @refresherrefresh="refresherrefresh"
      @scrolltolower="scrolltolower"
    >
      <list-item slot="refresher" class="refresh-box">
        <text class="text">{{ refreshText[refreshState] }}</text>
      </list-item>

      <!-- 列表渲染 -->
      <list-item
        v-for="item in articleList"
        :class="['list-item', `list-item__thumbnail-${item.thumbnail.length}`]"
        :key="item._id"
        @click="goToDetailPage(item)"
      >
        <template v-if="item.thumbnail.length == 0">
          <view class="list-item__content">
            <view class="list-item__content-title">
              <text class="text">{{ item.title }}</text>
            </view>
            <view class="list-item__content-info">
              <view class="list-item__author">
                <text class="text">{{ item!.user_id!.length > 0 ? item.user_id[0].nickname : '' }}</text>
              </view>
              <view class="list-item__publish-date">
                <text class="text">{{ publishTime(item.publish_date) }}</text>
              </view>
            </view>
          </view>
        </template>
        <template v-if="item.thumbnail.length == 1">
          <view class="list-item__content">
            <view class="list-item__content-title">
              <text class="text">{{ item.title }}</text>
            </view>
            <view class="list-item__content-info">
              <view class="list-item__author">
                <text class="text">{{ item!.user_id!.length > 0 ? item.user_id[0].nickname : '' }}</text>
              </view>
              <view class="list-item__publish-date">
                <text class="text">{{ publishTime(item.publish_date) }}</text>
              </view>
            </view>
          </view>
          <view class="list-item__thumbnails">
            <image
              v-for="image in item.thumbnail"
              :src="image"
              mode="aspectFill"
              class="list-item__img"
            ></image>
          </view>
        </template>
        <template v-if="item.thumbnail.length == 3">
          <view class="list-item__content">
            <view class="list-item__content-title">
              <text>{{ item.title }}</text>
            </view>
            <view class="list-item__thumbnails">
              <image
                v-for="image in item.thumbnail"
                :src="image"
                mode="aspectFill"
                class="list-item__img"
              ></image>
            </view>
            <view class="list-item__content-info">
              <view class="list-item__author">
                <text class="text">{{ item!.user_id!.length > 0 ? item.user_id[0].nickname : '' }}</text>
              </view>
              <view class="list-item__publish-date">
                <text class="text">{{ publishTime(item.publish_date) }}</text>
              </view>
            </view>
          </view>
        </template>
      </list-item>
      <list-item class="load-state">
        <text class="text">{{ loading ? '加载中...' : (hasMore ? '上拉加载更多' : '没有更多数据了') }}</text>
      </list-item>
    </list-view>
  </unicloud-db>
</template>

<script lang="uts">
type ArticleAuthor = {
  _id: string
  nickname: string
}
type ArticleItem = {
  _id: string
  title: string
  publish_date: number
  thumbnail: string[]
  user_id: ArticleAuthor[]
}

import {parseImageUrl} from "@/uni_modules/uni-cms-article/common/parse-image-url.uts";
import translatePublishTime from "@/uni_modules/uni-cms-article/common/publish-time.uts";
import type {ParseImageUrlResult} from '@/uni_modules/uni-cms-article/common/parse-image-url.uts'

export default {
  name: "uni-cms-article-list",
  emits: ['onRefresh', 'onLoadMore'],
  props: {
    collectionList: {
      type: Array as any[],
      default: (): any[] => []
    },
    loadTime: {
      type: String,
      default: 'auto'
    },
    refresherEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      articleList: [] as ArticleItem[],
      refresherTriggered: false,
      refreshState: 0,
      refreshText: [
        '继续下拉执行刷新',
        '释放立即刷新',
        '正在加载中',
        '加载成功'
      ],
      networkType: ""
    }
  },
  mounted () {
    this.checkNetwork()
  },
  methods: {
    checkNetwork() {
      uni.getNetworkType({
        success: (res) => {
          this.networkType = res.networkType;
        }
      });
    },
    publishTime(timestamp: number): string {
      return translatePublishTime(timestamp)
    },
    async onListLoad(data: UTSJSONObject[], ended: boolean, pagination: UTSJSONObject): Promise<void> {
      const listData: ArticleItem[] = data.map((item: UTSJSONObject): ArticleItem => {
        let articleItem: ArticleItem = {
          _id: item.getString('_id')!,
          title: item.getString('title')!,
          publish_date: item.getNumber('publish_date')!,
          thumbnail: [],
          user_id: item.getArray<ArticleAuthor>('user_id')! as ArticleAuthor[]
        }

        if (typeof item.getAny('thumbnail') === 'string') {
          articleItem.thumbnail = [item.getAny('thumbnail')! as string]
        } else {
          articleItem.thumbnail = item.getArray<string>('thumbnail')!
        }

        return articleItem
      })

      // 处理cloud://文件链接
      for (let i = 0; i < listData.length; i++) {
        const article = listData[i]
        const parseImages = await parseImageUrl(article.thumbnail)

        if (parseImages != null) {
          article.thumbnail = parseImages.map((image: ParseImageUrlResult): string => image.src)
        }
      }

      this.articleList = pagination.getNumber('current') == 1 ? listData : this.articleList.concat(listData)
    },
    refresherrefresh() {
      this.refresherTriggered = true
      this.refreshState = 2;

      (this.$refs['udb'] as UniCloudDBElement)!.loadData({
        clear: true,
        success: (_: any) => {
          this.refresherTriggered = false
          this.refreshState = 3
        }
      })
    },
    refresherpulling(e: RefresherEvent) {
      if (e.detail.dy.toDouble() == 0.0) {
        this.refreshState = 0
      } else if (e.detail.dy > 45) {
        this.refreshState = 1
      }
    },
    scrolltolower() {
      (this.$refs['udb'] as UniCloudDBElement)!.loadMore()
    },
    reLoadList() {
      (this.$refs['udb'] as UniCloudDBElement)!.loadData({
        clear: true
      })
    },
    goToDetailPage(article: ArticleItem) {
      uni.navigateTo({
        url: `/uni_modules/uni-cms-article/pages/detail/detail?id=${article._id}&title=${article.title}`
      })
    },
    onListLoadError () {
      this.checkNetwork()
    }
  }
}
</script>

<style scoped lang="scss">
.refresh-box {
  display: flex;
  align-items: center;
  justify-content: center;

  .text {
    padding: 30rpx 0;
    font-size: 26rpx;
    color: #999999;
  }
}

.error-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  align-items: center;
  justify-content: center;

  .disconnect-icon {
    width: 200rpx;
    margin: 0 auto;
  }

  .tip-text {
    font-size: 26rpx;
    color: #333;
    margin-top: 40rpx;
  }
}

.load-state {
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .text {
    font-size: 28rpx;
    color: #999999;
  }
}

.list-view {
  height: 100%;
  padding: 0 20rpx;
}

.list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: #f5f5f5 solid 1px;

  &__thumbnail-1 {
    .list-item__content-title {
      height: 88rpx;
    }
  }

  &__thumbnail-3 {
    .list-item__thumbnails {
      display: flex;
      flex-direction: row;
      margin: 20rpx -10rpx;
      margin-left: -10rpx;
      margin-bottom: 0;
    }

    .list-item__img {
      margin: 0 10rpx;
      flex: 1;
    }
  }

  &__thumbnails {
    margin-left: 20rpx;
  }

  &__img {
    width: 240rpx;
    height: 160rpx;
    border-radius: 8rpx;
  }

  &__content {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    flex: 1;
    height: 100%;

    &-title {
      overflow: hidden;

      .text {
        font-size: 30rpx;
        color: #333333;
        line-height: 44rpx;
      }
    }

    &-info {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-top: 20rpx;
    }
  }

  &__author,
  &__publish-date {
    .text {
      font-size: 24rpx;
      color: #bbbbbb;
    }
  }

  &__author {
    margin-right: 14rpx;
  }
}


</style>
