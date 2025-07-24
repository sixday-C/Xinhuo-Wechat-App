'use strict';
exports.main = async (event, context) => {
  const { action, pwd } = event;

  // 简单示例：密码写死 123456，实际请用云数据库
  if (action === 'login') {
    if (pwd === '114514') {
      return { code: 0, token: 'admin_token_fake' };
    } else {
      return { code: 1, msg: '密码错误' };
    }
  }

  // 示例：拉用户列表
  if (action === 'getUsers') {
    const db = uniCloud.database()
    const res = await db.collection('users').limit(100).get()
    return res.data
  }

  return { code: 404, msg: '未知操作' }
}