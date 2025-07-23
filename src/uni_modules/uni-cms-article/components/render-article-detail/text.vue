<template>
  <view :class="classList">
    <template v-for="item in data">
      <text
          v-if="item.type === 'text'"
          :class="item.data.class"
          :style="item.data.style"
          class="text"
      >
        {{item.data.value}}
      </text>
      <text
          v-if="item.type === 'link'"
          :class="item.data.class"
          :style="item.data.style"
          class="link"
          @click="goLink(item.data.attributes.link)"
      >
        {{item.data.value}}
      </text>
      <image-item v-else-if="item.type === 'image'" :data="item"></image-item>
      <!-- #ifdef H5 -->
      <br v-else-if="item.type === 'br'" class="br"/>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <text v-else-if="item.type === 'br'" class="br">\n</text>
      <!-- #endif -->
    </template>
  </view>
</template>
<script>
import ImageItem from './image.vue'

export default {
  name: "render-text",
  props: {
    data: {
      type: Array,
      default () {
        return []
      }
    },
    className: String,
    reset: Boolean
  },
  computed: {
    classList () {
      return [
        'row-text',
        this.className,
        this.reset ? 'reset': ''
      ]
    }
  },
  components: {
    ImageItem
  },
  methods: {
    show () {
      uni.showToast({
        title: 'test',
        icon: 'none'
      })
    },
    // 点击链接跳转
    goLink(link) {
      // 如果链接为空，则返回
      if (!link) return

      // #ifdef H5
      // 在新窗口中打开链接
      window.open(link, '_blank')
      // #endif

      // #ifdef MP
      // 微信小程序不支持打开外链，复制链接到剪贴板
      uni.setClipboardData({
        data: link,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'none'
          })
        }
      })
      // #endif

      // #ifdef APP
      // 在webview中打开链接
      uni.navigateTo({
        url: `/uni_modules/uni-cms-article/pages/webview/webview?url=${encodeURIComponent(link)}`
      })
      // #endif
    }
  }
}
</script>

<style scoped lang="scss">

.row-text, .br {
  margin-bottom: 40rpx;
  &.reset {
    margin-bottom: 0;
  }
}
.header-1,
.header-2,
.header-3,
.header-4,
.header-5,
.header-6 {
  font-weight: bold;
}

.header-1 {
  font-size: 44rpx;
}

.header-2 {
  font-size: 40rpx;
}

.header-3 {
  font-size: 38rpx;
}

.header-4 {
  font-size: 32rpx;
}

.header-5 {
  font-size: 28rpx;
}

.header-6 {
  font-size: 24rpx;
}

.bold {
  font-weight: bold;
}

.italic {
  font-style: italic;
}

.strike {
  text-decoration: line-through;
}

.underline {
  text-decoration: underline;
}

.link {
  color: #0064f9;
  text-decoration: underline;
}
</style>
