'use strict';
const db = uniCloud.database();
const url = 'https://api.weixin.qq.com/sns/jscode2session';

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
    
    const res = await uniCloud.httpclient.request(url, {
      method: 'GET',
      data: {
        appid: config.appId,
        secret: config.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      },
      dataType: 'json' // 添加这个参数确保返回 JSON
    });
    
    console.log('微信 API 响应:', res.data);
    
    // 如果 res.data 是 Buffer，需要转换
    let responseData = res.data;
    if (Buffer.isBuffer(responseData)) {
      try {
        responseData = JSON.parse(responseData.toString());
        console.log('解析后的响应:', responseData);
      } catch (parseError) {
        console.error('JSON 解析错误:', parseError);
        throw new Error('响应数据解析失败');
      }
    }
    
    if (responseData.errcode && responseData.errcode !== 0) {
      throw new Error(ERROR_MESSAGES.WX_API_ERROR(responseData.errmsg, responseData.errcode));
    }
    
    if (responseData.openid) {
      return { 
        openid: responseData.openid,
        session_key: responseData.session_key // 也可以返回 session_key
      };
    }
    
    throw new Error('获取OpenID失败');
  } catch (err) {
    console.error('云函数错误:', err.message);
    return { error: err.message };
  }
};