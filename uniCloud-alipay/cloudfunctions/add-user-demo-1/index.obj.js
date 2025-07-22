// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

const db=uniCloud.database();
module.exports = {
	_before: function () { // 通用预处理器

	},
	
	
	async addUser(userData){
		
		if(!userData.name) throw new Error('姓名不能为空');
		if(!userData.phone) throw new Error('手机号不能为空');
		if(!userData.address) throw new Error('地址不能为空')
		
		try {
		      // 构造要保存的数据对象
		      const userRecord = {
		        name: userData.name,
		        phone: userData.phone,
		        address: userData.address,
		        createTime: Date.now()          // 自动添加创建时间
		      };
		
		const res = await db.collection("demo-user").add(userRecord);
		return {
		        code: 200,
		        message: '用户添加成功',
		        id: res.id,          // 返回ID
		        inserted: res.affectedDocs // 返回插入数量
		      };
		}catch(e){
			 console.error('数据库写入失败:', e);
			      return {
			        code: 500,
			        message: `服务端错误: ${e.message}`
		}
	}
	
}}