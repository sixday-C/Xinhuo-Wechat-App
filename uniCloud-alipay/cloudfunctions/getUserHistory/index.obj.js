// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

'use strict';
const db = uniCloud.database();

module.exports = {
    async getUserHistory(params) {
        try {
            const { phone } = params;

            // 基础校验
            if (!phone) {
                throw new Error('手机号不能为空');
            }

            // 查询用户历史记录，这里假设有两个表：reports（上报记录）和 booking（预约记录）
            const reportsCol = db.collection('reports');
            const bookingCol = db.collection('booking');

            // 获取上报记录
            const reportsResult = await reportsCol
                .where({ phone })
                .orderBy('createTime', 'desc')
                .get();

            // 获取预约记录
            const bookingResult = await bookingCol
                .where({ phone })
                .orderBy('createTime', 'desc')
                .get();

            // 合并和格式化记录
            const historyList = [];

            // 处理上报记录
            reportsResult.data.forEach(item => {
                let status = '已处理';
                let progress = 100;

                // 根据处理状态设置进度
                if (item.status === 'pending') {
                    status = '待处理';
                    progress = 25;
                } else if (item.status === 'processing') {
                    status = '处理中';
                    progress = 60;
                } else if (item.status === 'completed') {
                    status = '已处理';
                    progress = 100;
                }

                historyList.push({
                    id: item._id,
                    title: item.description || item.title || '事务上报',
                    date: item.createTime ? new Date(item.createTime).toISOString().split('T')[0] : '',
                    status: status,
                    progress: progress,
                    type: 'report',
                    location: item.location || '小区公共区域',
                    description: item.description || ''
                });
            });

            // 处理预约记录
            bookingResult.data.forEach(item => {
                const appointmentDate = new Date(item.appointmentDate);
                const now = new Date();
                let status = '已处理';
                let progress = 100;

                // 根据预约日期判断状态
                if (appointmentDate > now) {
                    status = '待处理';
                    progress = 50;
                }

                historyList.push({
                    id: item._id,
                    title: `线下预约 - ${item.timeSlot}`,
                    date: item.appointmentDate,
                    status: status,
                    progress: progress,
                    type: 'appointment',
                    location: item.address || '社区服务中心',
                    description: `预约时间：${item.appointmentDate} ${item.timeSlot}`
                });
            });

            // 按日期排序
            historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

            return {
                code: 200,
                message: '获取成功',
                data: historyList
            };

        } catch (e) {
            console.error('getUserHistory 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误',
                data: []
            };
        }
    }
}; 