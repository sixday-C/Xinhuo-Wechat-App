'use strict';
// 普通云函数
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { userData } = event;

	if (!userData.name) {
		return { code: 400, message: '姓名不能为空' };
	}
	if (!userData.phone) {
		return { code: 400, message: '手机号不能为空' };
	}

	try {
		// 检查手机号是否已存在
		const existUser = await db.collection("demo_user")
			.where({ phone: userData.phone })
			.get();

		if (existUser.data.length > 0) {
			return { code: 400, message: '手机号已存在' };
		}

		const userRecord = {
			name: userData.name,
			phone: userData.phone,
			address: userData.address || '',
			createTime: Date.now()
		};

		const res = await db.collection("demo_user").add(userRecord);

		return {
			code: 200,
			message: '用户添加成功',
			data: {
				id: res.id,
				...userRecord
			}
		};
	} catch (e) {
		console.error('用户添加失败:', e);
		return {
			code: 500,
			message: `服务器错误: ${e.message}`
		};
	}
};
