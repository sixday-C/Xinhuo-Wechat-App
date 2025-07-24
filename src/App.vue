<script>

export default {
  onLaunch: function () {
    // #ifdef H5
        const token = uni.getStorageSync('admin_token');
        if (!token) {
          uni.reLaunch({ url: '/pages-admin/login/login' });
        } else {
          uni.reLaunch({ url: '/pages-admin/indad/indad' });
        }
        // #endif
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}

</script>

<style>
/*每个页面公共css */
</style>
