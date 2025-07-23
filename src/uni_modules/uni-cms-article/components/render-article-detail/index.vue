<template>
	<view class="content">
		<template v-for="op in content">
			<render-text
				v-if="op.type === 'paragraph'"
				:data="op.data"
				:className="op.class"
				:style="op.style"
			></render-text>
			<render-image
				v-else-if="op.type === 'image' && op.data.length > 0"
				:data="op.data[0]"
				:className="op.class"
				:style="op.style"
			></render-image>
			<render-list
				v-else-if="op.type === 'list'"
				:data="op.data"
				:style="op.style"
			></render-list>
			<view
				v-else-if="op.type === 'divider'"
				class="divider"
			></view>
			<render-video
				v-else-if="op.type === 'mediaVideo'"
				:data="op.data"
			></render-video>
			<render-unlock-content
				v-else-if="op.type === 'unlockContent'"
				:adp-id="adConfig.adpId"
				:watch-ad-unique-type="adConfig.watchAdUniqueType"
			></render-unlock-content>
		</template>
	</view>
</template>

<script>
import {parseImageUrl} from "@/uni_modules/uni-cms-article/common/parse-image-url"

import text from './text.vue'
import image from './image.vue'
import video from './video.vue'
import list from './list.vue'
import unlockContent from './unlock-content.vue'

export default {
	name: "render-article-detail",
	props: {
    content: {
			type: Array,
			default () {
        return []
      }
		},
    contentImages: {
      type: Array,
      default () {
        return []
      }
    },
		adConfig: {
			type: Object,
			default: {}
		}
	},
	data() {
		return {
			articleImages: []
		}
	},
	components: {
		renderUnlockContent: unlockContent,
		renderText: text,
		renderImage: image,
		renderList: list,
		renderVideo: video
	},
	mounted() {
		this.initImage()
	},
  // #ifdef VUE2
  beforeDestroy() {
    uni.$off('imagePreview')
  },
  // #endif
  // #ifdef VUE3
  beforeUnmount () {
    uni.$off('imagePreview')
  },
  // #endif
	methods: {
		// 初始化图片
		async initImage() {
			// 获取所有图片
			const parseImages = await parseImageUrl(this.contentImages)

      if (parseImages != null) {
        this.articleImages = parseImages.map(image => image.src)
      }

			// 监听图片预览
			uni.$on('imagePreview', this.imagePreview)
		},
		// 点击图片预览
		imagePreview(src) {
			if (src) {
				uni.previewImage({
					current: src.split('?')[0], // 当前显示图片的http链接
					urls: this.articleImages // 需要预览的图片http链接列表
				})
			}
		},
	}
}
</script>

<style scoped lang="scss">
.content {
	line-height: 1.75;
	font-size: 32rpx;
	margin-top: 40rpx;
	padding: 0 30rpx 80rpx;
	word-break: break-word;
	color: #333;
}

.divider {
	height: 1px;
	background: #d8d8d8;
	width: 100%;
	margin: 40rpx 0;
}

</style>

