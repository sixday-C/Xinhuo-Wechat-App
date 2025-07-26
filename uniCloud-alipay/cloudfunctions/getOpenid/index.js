'use strict';

const db = uniCloud.database();

const ERROR_MESSAGES = {
  INVALID_CODE: '无效的 code',
  MISSING_CONFIG: '未找到微信配置',
  WX_API_ERROR: (msg, code) => `微信接口错误: ${msg} [${code}]`,
};

async function getConfig() {
  const res = await db.collection('config').doc('wx_config').get();
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
    const config = await getConfig();
    const res = await uniCloud.httpclient.request({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      method: 'GET',
      data: {
        appid: config.appId,
        secret: config.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
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