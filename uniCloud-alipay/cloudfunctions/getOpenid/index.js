'use strict';
  const db = uniCloud.database();

  const ERROR_MESSAGES = {
    INVALID_CODE: '无效的 code',
    MISSING_CONFIG: '未找到微信配置',
    WX_API_ERROR: (msg, code) => `微信接口错误: ${msg} [${code}]`,
  };

  async function getConfig() {
    const res = await db.collection('config').where({ config_key: 'wx_config' }).get();
    if (!res.data || res.data.length === 0) {
      throw new Error(ERROR_MESSAGES.MISSING_CONFIG);
    }
    return res.data[0];
  }

  exports.main = async (event) => {
    try {
      const { code } = event;
      if (!code || typeof code !== 'string') {
        throw new Error(ERROR_MESSAGES.INVALID_CODE);
      }
      console.log('输入 code:', code);
      const config = await getConfig();
      console.log('配置:', config);
      const res = await uniCloud.httpclient.request({
        url: 'https://api.weixin.qq.com/sns/jscode2session',
        method: 'GET',
        data: {
          appid: config.appId || config.appid,
          secret: config.appSecret || config.appsecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });
      console.log('微信 API 响应:', res.data);
      if (res.data.errcode && res.data.errcode !== 0) {
        throw new Error(ERROR_MESSAGES.WX_API_ERROR(res.data.errmsg, res.data.errcode));
      }
      if (res.data.openid) {
        return { openid: res.data.openid };
      }
      throw new Error('获取OpenID失败');
    } catch (err) {
      console.error('云函数错误:', err.message);
      return { error: err.message };
    }
  };