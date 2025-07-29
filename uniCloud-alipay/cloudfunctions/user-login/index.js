'use strict';

const db = uniCloud.database();

const ERROR_MESSAGES = {
  INVALID_PARAMS: '参数错误',
  USER_NOT_FOUND: '用户不存在',
  PASSWORD_ERROR: '密码错误',
  WX_LOGIN_FAILED: '微信登录失败',
  PHONE_EXISTS: '手机号已注册',
  OPENID_EXISTS: 'OpenID已绑定其他账号'
};

// 获取微信配置
async function getWxConfig() {
  const res = await db.collection('config').where({ config_key: 'wx_config' }).get();
  if (!res.data || res.data.length === 0) {
    throw new Error('未找到微信配置');
  }
  return res.data[0];
}

// 通过code获取openid
async function getOpenidByCode(code) {
  const wxConfig = await getWxConfig();
  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const requestData = {
    appid: wxConfig.appId,
    secret: wxConfig.appSecret,
    js_code: code,
    grant_type: 'authorization_code'
  };

  // 发起网络请求
  const res = await uniCloud.httpclient.request(url, {
    method: 'GET',
    data: requestData,
    dataType: 'json' // 指定返回数据为json格式
  });
  
  if (res.data.errcode && res.data.errcode !== 0) {
    throw new Error(`微信接口错误: ${res.data.errmsg} [${res.data.errcode}]`);
  }
  
  return res.data.openid;
}

// 账号密码登录
async function loginByPassword(phone, password) {
  if (!phone || !password) {
    throw new Error(ERROR_MESSAGES.INVALID_PARAMS);
  }
  
  const userCol = db.collection('demo-user');
  const queryRes = await userCol.where({ phone }).get();
  
  if (queryRes.data.length === 0) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
  
  const user = queryRes.data[0];
  if (user.password !== password) {
    throw new Error(ERROR_MESSAGES.PASSWORD_ERROR);
  }
  
  return {
    success: true,
    userId: user._id,
    userInfo: {
      _id: user._id,
      phone: user.phone,
      name: user.name,
      address: user.address,
      openid: user.openid || null
    }
  };
}

// 账号密码注册
async function registerByPassword(phone, password, name = '', address = '') {
  if (!phone || !password) {
    throw new Error(ERROR_MESSAGES.INVALID_PARAMS);
  }
  
  const userCol = db.collection('demo-user');
  
  // 检查手机号是否已存在
  const existRes = await userCol.where({ phone }).get();
  if (existRes.data.length > 0) {
    throw new Error(ERROR_MESSAGES.PHONE_EXISTS);
  }
  
  const addRes = await userCol.add({
    phone,
    password,
    name,
    address,
    createTime: new Date(),
    loginType: 'password' // 标记登录方式
  });
  
  return {
    success: true,
    userId: addRes.id,
    userInfo: {
      _id: addRes.id,
      phone,
      name,
      address,
      openid: null
    }
  };
}

// 微信登录
async function loginByWechat(code) {
  if (!code) {
    throw new Error(ERROR_MESSAGES.INVALID_PARAMS);
  }
  
  const openid = await getOpenidByCode(code);
  if (!openid) {
    throw new Error(ERROR_MESSAGES.WX_LOGIN_FAILED);
  }
  
  const userCol = db.collection('demo-user');
  const queryRes = await userCol.where({ openid }).get();
  
  if (queryRes.data.length > 0) {
    // 已有用户，直接登录
    const user = queryRes.data[0];
    return {
      success: true,
      userId: user._id,
      userInfo: {
        _id: user._id,
        phone: user.phone || null,
        name: user.name,
        address: user.address,
        openid: user.openid
      }
    };
  } else {
    // 新用户，创建账号
    const addRes = await userCol.add({
      openid,
      name: '',
      address: '',
      createTime: new Date(),
      loginType: 'wechat' // 标记登录方式
    });
    
    return {
      success: true,
      userId: addRes.id,
      isNewUser: true,
      userInfo: {
        _id: addRes.id,
        phone: null,
        name: '',
        address: '',
        openid
      }
    };
  }
}

// 绑定手机号到微信账号
async function bindPhoneToWechat(userId, phone, password) {
  if (!userId || !phone || !password) {
    throw new Error(ERROR_MESSAGES.INVALID_PARAMS);
  }
  
  const userCol = db.collection('demo-user');
  
  // 检查手机号是否已被其他账号使用
  const phoneRes = await userCol.where({ phone }).get();
  if (phoneRes.data.length > 0 && phoneRes.data[0]._id !== userId) {
    throw new Error(ERROR_MESSAGES.PHONE_EXISTS);
  }
  
  // 更新用户信息
  await userCol.doc(userId).update({
    phone,
    password
  });
  
  return { success: true };
}

exports.main = async (event) => {
  try {
    const { action, phone, password, code, name, address, userId } = event;
    
    switch (action) {
      case 'passwordLogin':
        return await loginByPassword(phone, password);
        
      case 'passwordRegister':
        return await registerByPassword(phone, password, name, address);
        
      case 'wechatLogin':
        return await loginByWechat(code);
        
      case 'bindPhone':
        return await bindPhoneToWechat(userId, phone, password);
        
      default:
        throw new Error('未知操作类型');
    }
  } catch (err) {
    console.error('用户登录云函数错误:', err.message);
    return { 
      success: false, 
      error: err.message 
    };
  }
};
