// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

'use strict';
const db = uniCloud.database();

module.exports = {
    /**
     * 获取用户历史记录
     * @param {object} params 查询参数
     * @param {string} params.phone 用户手机号
     */
    async getUserHistory(params) {
        try {
            const { phone } = params;

            // 基础校验
            if (!phone) {
                throw new Error('手机号不能为空');
            }

            // 查询All_Report表中该用户的所有记录 (注意表名需要与数据库一致)
            const allReportCol = db.collection('All_Report'); // 统一使用All_Report
            const bookingCol = db.collection('booking');

            console.log('开始查询用户历史记录，手机号：', phone);

            // 先查看数据库中到底有什么数据
            const debugResult = await allReportCol
                .orderBy('createTime', 'desc')
                .limit(10)
                .get();

            console.log('=== 数据库调试信息 ===');
            console.log('数据库中总记录数（前10条）：', debugResult.data?.length || 0);

            if (debugResult.data && debugResult.data.length > 0) {
                console.log('第一条记录样例：', JSON.stringify(debugResult.data[0], null, 2));

                // 列出所有记录的userPhone字段
                const phoneList = debugResult.data.map(item => ({
                    id: item._id,
                    userPhone: item.userPhone,
                    userName: item.userName,
                    isAnonymous: item.isAnonymous,
                    description: item.description?.substring(0, 20) + '...'
                }));
                console.log('所有记录的手机号信息：', JSON.stringify(phoneList, null, 2));
            }

            // 获取上报记录
            const reportsResult = await allReportCol
                .where({ userPhone: phone })
                .orderBy('createTime', 'desc')
                .get();

            console.log('按userPhone查询结果：', reportsResult.data?.length || 0, '条记录');
            console.log('查询条件：userPhone =', phone);
            console.log('=== 调试信息结束 ===');

            // 获取预约记录
            const bookingResult = await bookingCol
                .where({ phone })
                .orderBy('createTime', 'desc')
                .get();

            // 合并和格式化记录
            const historyList = [];

            // 处理上报记录
            reportsResult.data.forEach(item => {
                let progress = 25;

                // 根据处理状态设置进度
                if (item.status === '待处理') {
                    progress = 25;
                } else if (item.status === '处理中') {
                    progress = 60;
                } else if (item.status === '已处理') {
                    progress = 100;
                }

                // 格式化创建时间
                let formatDate = '';
                if (item.createTime) {
                    if (typeof item.createTime === 'number') {
                        formatDate = new Date(item.createTime).toISOString().split('T')[0];
                    } else if (item.createTime instanceof Date) {
                        formatDate = item.createTime.toISOString().split('T')[0];
                    } else {
                        formatDate = item.createTime.toString().split('T')[0];
                    }
                }

                // 生成标题（根据描述内容截取前10个字符）
                let title = item.description || '问题上报';
                if (title.length > 10) {
                    title = title.substring(0, 10) + '...';
                }

                historyList.push({
                    id: item._id,
                    title: title,
                    date: formatDate,
                    status: item.status || '待处理',
                    progress: progress,
                    type: 'report',
                    category: item.category || '其他问题',
                    location: item.locationInfo?.address || item.userAddress || '小区公共区域',
                    description: item.description || '',
                    priority: item.priority || 2,
                    reportTime: item.reportTime,
                    processedTime: item.processedTime,
                    imageUrls: item.imageUrls || []
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
                    category: '线下预约',
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