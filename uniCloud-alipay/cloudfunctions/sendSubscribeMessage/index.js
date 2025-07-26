'use strict';
const db = uniCloud.database();

let accessTokenCache = { token: '', expireTime: 0 };

async function getConfig() {
const res = await db.collection('config').where({ config_key: 'wx_config' }).get();
if (!res.data || res.data.length === 0) {
  throw new Error('未找到微信配置');
}
return res.data[0];
}

async function getAccessToken() {
if (accessTokenCache.token && Date.now() < accessTokenCache.expireTime) {
  return accessTokenCache.token;
}
const config = await getConfig();
const res = await uniCloud.httpclient.request({
  url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId || config.appid}&secret=${config.appSecret || config.appsecret}`,
  method: 'GET'
});
if (res.data.errcode) {
  throw new Error(res.data.errmsg);
}
accessTokenCache = {
  token: res.data.access_token,
  expireTime: Date.now() + (res.data.expires_in - 300) * 1000
};
return accessTokenCache.token;
}

async function sendWeChatMessage(openid, templateData) {
const config = await getConfig();
const accessToken = await getAccessToken();
const postData = {
  touser: openid,
  template_id: config.subscribe_template_id,
  page: '/pages/index/index',
  data: {
	thing1: { value: templateData.thing1.slice(0, 20) },
	time2: { value: templateData.time2 }
  }
};
const res = await uniCloud.httpclient.request({
  url: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
  method: 'POST',
  data: postData
});
if (res.data.errcode) {
  throw new Error(res.data.errmsg);
}
return { success: true, msg: '消息发送成功' };
}

exports.main = async (event) => {
const { openids, templateData } = event;
if (!openids || !templateData || !templateData.thing1 || !templateData.time2) {
  return { code: 400, msg: '参数缺失' };
}
const results = [];
for (const openid of openids) {
  try {
	const result = await sendWeChatMessage(openid, templateData);
	results.push(result);
  } catch (err) {
	results.push({ success: false, msg: err.message });
  }
}
return { success: true, results };
};