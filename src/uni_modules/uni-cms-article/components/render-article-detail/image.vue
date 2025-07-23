<template>
  <view
      :class="classList"
      v-if="data.data"
  >
    <image
        :src="imagePath"
        :class="data.data.class"
        :style="styles"
        :alt="data.data.attributes.alt || ''"
        class="img"
        mode="aspectFill"
        @load="imageLoad"
        @click="imagePreview"
    ></image>
  </view>
</template>
<script>
import {parseImageUrl} from "@/uni_modules/uni-cms-article/common/parse-image-url.js";

export default {
  name: "render-image",
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    },
    className: String,
    reset: false
  },
  data () {
    return {
      width: 0,
      height: 0,
	    imagePath: ''
    }
  },
  computed: {
    classList () {
      return [
        'image',
          this.reset ? 'reset': '',
        this.className
      ]
    },
    styles () {
      let style = this.data.data.style

      if (this.width) {
        style += `;width:${this.width}px`
      }
      if (this.height) {
        style += `;height:${this.height}px`
      }
      return style
    }
  },
	mounted () {
		this.loadImagePath()
	},
  methods: {
	  async loadImagePath () {
			const parseImages = await parseImageUrl({
				insert: {image: this.data.data.value},
				attributes: this.data.data.attributes,
			}, "editor")

		  this.imagePath = parseImages[0].src
    },
    imagePreview () {
      uni.$emit('imagePreview', this.data.data.value)
    },
    // 图片加载完成
    imageLoad(e) {
      const recal = this.wxAutoImageCal(e.detail.width, e.detail.height, 15) // 计算图片宽高
      // const image = this.data

      // ::TODO 关注一下在多端得表现情况
      // if (!image.data.attributes.width || Number(image.data.attributes.width) > recal.imageWidth) {
        // 如果图片宽度不存在或者图片宽度大于计算出来的宽度，则设置图片宽高
        this.width = recal.imageWidth
        this.height = recal.imageHeight
      // }
    },

    // 计算图片宽高
    wxAutoImageCal(originalWidth, originalHeight, imagePadding = 0) {
      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync()
      let windowWidth = 0, windowHeight = 0;
      let autoWidth = 0, autoHeight = 0;
      let results = {};
      // 计算图片宽度
      windowWidth = systemInfo.windowWidth - 2 * imagePadding;
      windowHeight = systemInfo.windowHeight;
      if (originalWidth > windowWidth) {//在图片width大于手机屏幕width时候
        autoWidth = windowWidth;
        autoHeight = (autoWidth * originalHeight) / originalWidth;
        results.imageWidth = autoWidth;
        results.imageHeight = autoHeight;
      } else {//否则展示原来的数据
        results.imageWidth = originalWidth;
        results.imageHeight = originalHeight;
      }
      return results;

    }
  }
}
</script>

<style scoped lang="scss">
  .image {
    margin-bottom: 40rpx;
    &.reset {
      margin-bottom: 0;
    }
    .img {
      // #ifdef APP-PLUS
      display: block;
      // #endif
      // #ifndef APP-PLUS
      display: flex;
      // #endif
      border-radius: 12rpx;
      margin: 0 auto;
    }
  }
</style>
