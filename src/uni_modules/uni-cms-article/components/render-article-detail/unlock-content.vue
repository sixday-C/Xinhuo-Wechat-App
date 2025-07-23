<template>
  <view class="unlock-content">
  
  </view>
</template>

<script>
// 实例化数据库
const db = uniCloud.database()
// 定义解锁记录表名
const unlockContentDBName = 'uni-cms-unlock-record'

export default {
  name: "ad",
  props: {
    adpId: String,
    watchAdUniqueType: {
      type: String,
      default: 'device'
    },
  },
  data() {
    return {
      currentArticleId: '',
      currentPageRoute: '',
      adLoading: false,
      isLoadError: false
    }
  },
  computed: {
    // 回调URL
    urlCallback() {
      return {
        extra: JSON.stringify({
          article_id: this.currentArticleId,
          unique_id: this.uniqueId,
          unique_type: this.watchAdUniqueType
        })
      }
    },
    // 是否通过设备观看
    watchByDevice() {
      return this.watchAdUniqueType === 'device'
    },
    // 是否通过用户观看
    watchByUser() {
      return this.watchAdUniqueType === 'user'
    },
    // 获取唯一ID
    uniqueId() {
      return this.watchByDevice ? uni.getSystemInfoSync().deviceId : uniCloud.getCurrentUserInfo().uid
    }
  },
  // #ifndef H5
  mounted() {
    // 获取当前页面信息
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    this.currentArticleId = currentPage.options.id
    this.currentPageRoute = currentPage.route

    // 如果广告位ID未设置，则提示广告无法正常加载
    if (!this.adpId) {
      uni.showModal({
        content: '广告位ID未设置，广告无法正常加载',
        showCancel: false
      })
    } else {
      // 加载广告
      this.$refs.rewardedVideo.load()
    }
  },
  // #endif
  methods: {
    // 调用广告
    callAd() {
      // #ifdef H5
      // 如果在浏览器中，则提示需在App或小程序中操作
      return uni.showModal({
        content: '需观看广告解锁内容, 但浏览器不支持广告播放, 请在App或小程序中操作',
        showCancel: false
      })
      // #endif

      if (this.watchByUser) {
        // 登录跳转URL 请根据实际情况修改
        const redirectUrl = '/uni_modules/uni-id-pages/pages/login/login-withoutpwd' + (this.currentPageRoute ? '?uniIdRedirectUrl=' + this.currentPageRoute + '?id=' + this.currentArticleId : '')

        //::TODO 支持设备与用户
        // 如果用户未登录，则提示需要登录
        if (uniCloud.getCurrentUserInfo().tokenExpired < Date.now()) {
          uni.showModal({
            content: '请登录后操作',
            success: ({ confirm }) => {
              confirm && uni.redirectTo({
                url: redirectUrl
              });
            }
          })
        }
      }

      // 显示广告
      this.adLoading = true
      this.$refs.rewardedVideo.show()
    },
    // 广告加载成功
    onAdLoad() {
      this.adLoading && this.$refs.rewardedVideo.show()
      console.log('广告数据加载成功');
    },
    // 广告关闭
    onAdClose(e) {
      console.log('close', e)
      const detail = e.detail
      // 轮询3次，每次1秒，如果3秒内没有查询到解锁记录，就提示解锁失败
      let i = 3
      uni.hideLoading()
      this.adLoading = false

      // detail.isEnded 为true 说明用户观看了完整视频
      if (detail && detail.isEnded) {
        uni.showLoading({
          title: '正在解锁全文',
          timeout: 7000
        })
        let queryResult = setInterval(async () => {
          i--;

          // 查询解锁记录
          const res = await db.collection(unlockContentDBName).where({
            unique_id: this.uniqueId,
            article_id: this.currentArticleId,
          }).get()

          // 1. result.data.length 为0 说明没有解锁记录
          // 2. i <= 0 说明已经轮询了3次，还是没有解锁记录，说明解锁失败
          // 3. result.data.length && i > 0 说明已经解锁成功
          if (i <= 0) {
            console.log('解锁失败', i)
            clearInterval(queryResult)
            uni.hideLoading()
            uni.showToast({
              title: '解锁失败！',
              icon: 'error',
              duration: 2000
            });
          } else if (res.result && res.result.data.length) {
            console.log('解锁成功', i)

            clearInterval(queryResult)
            uni.hideLoading()
            uni.showToast({
              title: '解锁成功！',
              icon: 'success',
              duration: 2000
            });
            uni.$emit('onUnlockContent')
          }
        }, 1500);
      } else {
        uni.showModal({
          content: "请观看完整视频后解锁全文",
          showCancel: false
        })
      }
    },
    onAdError(e) {
      // uni.hideLoading()
      // this.isLoadError = true
      console.error('onaderror: ', e)
    }
  }
}
</script>


<style scoped lang="scss">
.unlock-content {
  text-align: center;
  padding: 160rpx 0 60rpx;
  position: relative;
  margin-top: -140rpx;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 160rpx;
    background: linear-gradient(to bottom, transparent, #fff);
  }

  .text {
    border: #f0f0f0 solid 1px;
    display: inline-block;
    background: #f6f6f6;
    border-radius: 10rpx;
    font-size: 34rpx;
    color: #222;
  }
}
</style>
