// 用户登录状态管理工具
class UserManager {
  // 获取当前用户信息
  static getCurrentUser() {
    try {
      const userInfo = uni.getStorageSync('user_info');
      const isLoggedIn = uni.getStorageSync('is_logged_in');
      
      if (isLoggedIn && userInfo) {
        return userInfo;
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }
  
  // 检查是否已登录
  static isLoggedIn() {
    try {
      return !!uni.getStorageSync('is_logged_in');
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }
  
  // 获取用户ID
  static getCurrentUserId() {
    try {
      return uni.getStorageSync('current_user_id');
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return null;
    }
  }
  
  // 登出
  static logout() {
    try {
      uni.removeStorageSync('current_user_id');
      uni.removeStorageSync('user_info');
      uni.removeStorageSync('is_logged_in');
      
      // 跳转到登录页
      uni.reLaunch({ url: '/pages/Login/Login' });
      
      return true;
    } catch (error) {
      console.error('登出失败:', error);
      return false;
    }
  }
  
  // 更新用户信息
  static updateUserInfo(userInfo) {
    try {
      uni.setStorageSync('user_info', userInfo);
      return true;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }
  }
  
  // 检查是否有微信绑定
  static hasWechatBound() {
    const user = this.getCurrentUser();
    return user && user.openid;
  }
  
  // 检查是否有手机号绑定
  static hasPhoneBound() {
    const user = this.getCurrentUser();
    return user && user.phone;
  }
}

// 导出为 ES6 模块（用于 Vue 组件 import）
export default UserManager;
