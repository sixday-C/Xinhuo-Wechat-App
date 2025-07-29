'use strict';
exports.main = async (event, context) => {
  const { code, iv, encryptedData } = event;
  // 调用内置解密接口
  const res = await uniCloud.getPhoneNumber({ code, iv, encryptedData });
  // 返回手机号给客户端
  return { phoneNumber: res.phoneNumber };
};