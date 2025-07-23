// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

'use strict';
const db = uniCloud.database();

module.exports = {
    /**
     * 保存或更新用户信息
     * @param {object} userInfo 用户信息对象
     * @param {string} userInfo.phone 手机号
     * @param {string} userInfo.name 姓名
     * @param {string} userInfo.address 地址
     */
    async saveUserInfo(userInfo) {
        try {
            const { phone, name, address } = userInfo;

            // 基础校验
            if (!phone) {
                throw new Error('手机号不能为空');
            }
            if (!name) {
                throw new Error('姓名不能为空');
            }
            if (!address) {
                throw new Error('地址不能为空');
            }

            // 手机号格式校验
            const phonePattern = /^1[3-9]\d{9}$/;
            if (!phonePattern.test(phone)) {
                throw new Error('手机号格式不正确');
            }

            const userCol = db.collection('user');

            // 检查用户是否已存在
            const existUser = await userCol
                .where({ phone })
                .get();

            const userData = {
                phone,
                name,
                address,
                updateTime: Date.now()
            };

            let result;
            if (existUser.data.length > 0) {
                // 更新现有用户
                result = await userCol
                    .where({ phone })
                    .update(userData);

                return {
                    code: 200,
                    message: '用户信息更新成功',
                    data: {
                        ...userData,
                        _id: existUser.data[0]._id
                    }
                };
            } else {
                // 创建新用户
                userData.createTime = Date.now();
                result = await userCol.add(userData);

                return {
                    code: 200,
                    message: '用户信息保存成功',
                    data: {
                        ...userData,
                        _id: result.id
                    }
                };
            }

        } catch (e) {
            console.error('saveUserInfo 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误'
            };
        }
    },

    /**
     * 根据手机号获取用户信息
     * @param {string} phone 手机号
     */
    async getUserInfo(phone) {
        try {
            if (!phone) {
                throw new Error('手机号不能为空');
            }

            const userCol = db.collection('user');
            const result = await userCol
                .where({ phone })
                .get();

            if (result.data.length === 0) {
                return {
                    code: 404,
                    message: '用户不存在',
                    data: null
                };
            }

            return {
                code: 200,
                message: '获取用户信息成功',
                data: result.data[0]
            };

        } catch (e) {
            console.error('getUserInfo 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误',
                data: null
            };
        }
    }
}; 