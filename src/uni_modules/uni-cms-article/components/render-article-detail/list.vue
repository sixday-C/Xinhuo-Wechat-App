<template>
  <view :class="['list', data.type]">
    <view class="list-item" v-for="(item, index) in data.items">
      <text class="dot">{{data.type === 'ordered' ? `${index + 1}.` : '&#8226'}}</text>
      <render-text :data="item.data" reset class="reset-default"></render-text>
    </view>
  </view>
</template>
<script>
import text from './text.vue'

export default {
  name: "render-list",
  props: {
    data: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  components: {
    renderText: text
  },
  methods: {

  }
}
</script>

<style scoped lang="scss">
  .list {
    margin-bottom: 40rpx;
  }
  .list-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20rpx;
    &:last-child {
      margin-bottom: 0;
    }
    .dot {
      margin-right: 10rpx;
    }
  }
  .reset-default {
    text-indent: 0;
    flex: 1;
  }
</style>
