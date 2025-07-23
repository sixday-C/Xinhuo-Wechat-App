<template>
  <view class="video">
    <video
        class="v"
        :src="data.attributes.src"
        :poster="data.attributes.poster"
    ></video>
  </view>
</template>
<script>
export default {
  name: "render-video",
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      width: 0,
      height: 0,
    }
  },
  methods: {

  }
}
</script>

<style scoped lang="scss">
  .video {
    margin-bottom: 40rpx;
    .v {
      display: block;
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      border-radius: 8rpx;
    }
  }
</style>
