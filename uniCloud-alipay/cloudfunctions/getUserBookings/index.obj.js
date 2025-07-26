'use strict';
const db = uniCloud.database();

module.exports = {
    async getUserBookings(params) {
        try {
            const { phone } = params;

            // 参数校验
            if (!phone) {
                return {
                    code: 400,
                    message: '手机号不能为空'
                };
            }

            console.log('getUserBookings 开始查询，手机号：', phone);

            // 直接查询数据库，不进行权限校验
            const bookingCol = db.collection('booking');

            // 查询该用户的所有预约记录
            const result = await bookingCol
                .where({ phone: phone })
                .orderBy('create_time', 'desc') // 按创建时间倒序
                .get();

            console.log('查询结果：', result.data?.length || 0, '条记录');

            // 处理数据，转换为前端需要的格式
            const bookings = result.data.map(item => {
                // 计算预约状态
                const appointmentDate = new Date(item.appointment_date);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());

                let status = '待服务';
                let progress = 30;

                if (appointmentDay < today) {
                    status = '已完成';
                    progress = 100;
                } else if (appointmentDay.getTime() === today.getTime()) {
                    status = '今日预约';
                    progress = 60;
                }

                // 内联格式化函数
                const formatDate = (dateStr) => {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                };

                const formatDateTime = (timestamp) => {
                    if (!timestamp) return '';
                    const date = new Date(timestamp);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                };

                return {
                    id: item._id,
                    title: `线下预约 - ${item.time_slot}`,
                    date: item.appointment_date,
                    timeSlot: item.time_slot,
                    status: status,
                    progress: progress,
                    category: '线下预约',
                    type: 'booking',
                    name: item.name,
                    phone: item.phone,
                    address: item.address,
                    createTime: item.create_time,
                    // 使用内联格式化函数
                    displayDate: formatDate(item.appointment_date),
                    displayCreateTime: formatDateTime(item.create_time)
                };
            });

            console.log('返回的预约数据：', JSON.stringify(bookings, null, 2));

            return {
                code: 200,
                message: '获取成功',
                data: bookings
            };

        } catch (e) {
            console.error('getUserBookings 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误',
                error: e.toString()
            };
        }
    }
}; 