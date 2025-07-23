<template>
  <uni-list-item
      :to="'/uni_modules/uni-cms-article/pages/detail/detail?id=' + data._id"
      :key="data._id"
      class="list-item"
      direction="column"
  >
    <template v-slot:body>
      <view class="main">
        <text class="title">{{ data.title }}</text>
        <view class="thumbnails">
          <image
              v-for="image in data.thumbnail"
              :src="image"
              mode="aspectFill"
              class="img"
          ></image>
        </view>
        <view class="info">
          <text class="author">{{ data.user_id[0] ? data.user_id[0].nickname : '' }}</text>
          <text class="publish_date">{{ publishTime(data.publish_date) }}</text>
        </view>
      </view>
    </template>
  </uni-list-item>
</template>

<script>
import translatePublishTime from "@/uni_modules/uni-cms-article/common/publish-time";

export default {
  name: "three-cover",
  props: {
    data: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  methods: {
    // 格式化时间戳
    publishTime(timestamp) {
      return translatePublishTime(timestamp)
    },
  }
}
</script>

<style scoped lang="scss">
@import "./style.scss";
</style>
