// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

'use strict';
const db = uniCloud.database();

module.exports = {
    async addReport(reportData) {
        try {
            const { phone, name, description, isAnonymous, images, location } = reportData;

            // 基础校验
            if (!description) {
                throw new Error('问题描述不能为空');
            }

            const reportsCol = db.collection('reports');

            // 构造报告记录
            const record = {
                phone: isAnonymous ? '' : phone,  // 匿名上报时不保存手机号
                name: isAnonymous ? '匿名用户' : name,  // 匿名上报时使用匿名用户
                description: description,
                isAnonymous: isAnonymous,
                images: images || [],  // 图片数组
                location: location || '小区公共区域',
                status: 'pending',  // pending, processing, completed
                createTime: Date.now(),
                updateTime: Date.now()
            };

            const res = await reportsCol.add(record);

            return {
                code: 200,
                message: '上报提交成功',
                id: res.id
            };

        } catch (e) {
            console.error('addReport 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误'
            };
        }
    }
}; 