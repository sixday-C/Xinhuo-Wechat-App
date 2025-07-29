// 在云函数中添加密码加密功能
const crypto = require('crypto');

// 生成密码hash
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// 生成随机盐值
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// 验证密码
function verifyPassword(password, hash, salt) {
  const hashToVerify = hashPassword(password, salt);
  return hash === hashToVerify;
}

module.exports = {
  hashPassword,
  generateSalt,
  verifyPassword
};
