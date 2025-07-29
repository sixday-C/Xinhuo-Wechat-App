// 输入验证工具
const VALIDATION_RULES = {
  phone: /^1[3-9]\d{9}$/,
  password: /^.{6,20}$/
};

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: '手机号不能为空' };
  }
  
  if (!VALIDATION_RULES.phone.test(phone)) {
    return { valid: false, message: '手机号格式不正确' };
  }
  
  return { valid: true };
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' };
  }
  
  if (!VALIDATION_RULES.password.test(password)) {
    return { valid: false, message: '密码长度应为6-20位' };
  }
  
  return { valid: true };
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // 移除潜在的恶意字符
  return input.trim()
    .replace(/[<>]/g, '')
    .substring(0, 100); // 限制最大长度
}

module.exports = {
  validatePhone,
  validatePassword,
  sanitizeInput
};
