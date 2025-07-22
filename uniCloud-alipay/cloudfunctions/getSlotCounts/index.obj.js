// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
'use strict';
const db = uniCloud.database();

module.exports = {
  async get(params) {
    const { dateList } = params;  // 前端传过来的日期数组
    const bookingCol = db.collection('booking');
    const counts = {};

    // 分别针对每个日期聚合：按 timeSlot 分组计数
    for (const date of dateList) {
      const result = await bookingCol.aggregate()
        .match({ appointmentDate: date })
        .group({
          _id: '$timeSlot',
          count: db.command.aggregate.count()
        })
        .end();
      result.data.forEach(item => {
        // 把结果放到 counts 对象里，key 格式 '2025-07-15|09:00-10:00'
        counts[`${date}|${item._id}`] = item.count;
      });
    }

    return {
      code: 200,
      data: counts
    };
  }
};
