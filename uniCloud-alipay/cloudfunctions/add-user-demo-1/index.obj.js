// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

const db = uniCloud.database();

module.exports = {
  _before: function () { // 通用预处理器
    // 这里可以添加通用的预处理逻辑
  },
  
  async addUser(userData) {
    if (!userData.name) throw new Error('姓名不能为空');
    if (!userData.phone) throw new Error('手机号不能为空');
    if (!userData.address) throw new Error('地址不能为空');
    
    try {
      const userRecord = {
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        createTime: Date.now()
      };
      
      const res = await db.collection('demo_user').add(userRecord);
      return {
        code: 200,
        message: '用户添加成功',
        id: res.id,
        inserted: res.affectedDocs
      };
    } catch (e) {
      console.error('数据库写入失败:', e);
      return {
        code: 500,
        message: `服务端错误: ${e.message}`
      };
    }
  },
  
  async function getUsers() {
    try {
      const res = await db.collection('demo_user')
                        .field('name, phone, address')
                        .get();
      return { code: 200, data: res.data };
    } catch (e) {
      console.error('获取用户列表失败:', e);
      return { code: 500, message: `服务端错误: ${e.message}` };
    }
  }
};

// 为了确保云函数能够根据 action 调用对应的方法，我们在这里添加一个主函数
exports.main = async (event, context) => {
  const { action, ...userData } = event;
  
  switch (action) {
    case 'addUser':
      return await module.exports.addUser(userData);
    case 'getUsers':
      return await module.exports.getUsers();
    default:
      return { code: 400, message: '未知 action' };
  }
};