'use strict';
exports.main = async (event, context) => {
try {
const { code, iv, encryptedData } = event;
if (!code || !iv || !encryptedData) {
return { success: false, message: '缺少参数 code/iv/encryptedData' };
}

// 调用 uniCloud.getPhoneNumber，并指定 provider
const res = await uniCloud.getPhoneNumber({
       // 微信小程序环境
provider: 'weixin',     // 如果是支付宝小程序，改为 'alipay'
code,
iv,
encryptedData
});

if (!res || !res.phoneNumber) {
return { success: false, message: '解密失败，未获取到手机号' };
}

return { success: true, phoneNumber: res.phoneNumber };
} catch (err) {
console.error('wx-decrypt-phone 执行异常：', err);
return { success: false, message: err.message || '云函数执行异常' };
}
};