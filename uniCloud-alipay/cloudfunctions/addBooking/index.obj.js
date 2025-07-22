// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
// cloudfunctions/addBooking/index.js
// cloudfunctions/addBooking/index.js
'use strict';
const db = uniCloud.database();

module.exports = {
  async addBooking(bookingData) {
    try {
      const { name, phone, address, appointmentDate, timeSlot } = bookingData;

      // 基础校验
      if (!name)             throw new Error('姓名不能为空');
      if (!phone)            throw new Error('手机号不能为空');
      if (!address)          throw new Error('住址不能为空');
      if (!appointmentDate)  throw new Error('预约日期不能为空');
      if (!timeSlot)         throw new Error('预约时段不能为空');

      const bookingCol = db.collection('booking');

      // 1. 限额校验：同一日期+同一时段最多 5 人
      const slotCountResult = await bookingCol
        .where({ appointmentDate, timeSlot })
        .count();
      if (slotCountResult.total >= 5) {
        return {
          code: 400,
          message: '该时段已约满（5 人），请选择其他时段'
        };
      }

      // 2. 单日单人校验：同一手机号同一天只能预约一次
      const dayCountResult = await bookingCol
        .where({ phone, appointmentDate })
        .count();
      if (dayCountResult.total > 0) {
        return {
          code: 400,
          message: '您当天已预约过一个时段，不能重复预约。'
        };
      }

      // 3. 写入新纪录
      const record = {
        name,
        phone,
        address,
        appointmentDate,  // 字符串
        timeSlot,         // 字符串
        // 推荐使用数据库服务器时间
      };
      const res = await bookingCol.add(record);

      return {
        code: 200,
        message: '预约提交成功',
        id: res.id
      };

    } catch (e) {
      console.error('addBooking 出错：', e);
      return {
        code: 500,
        message: e.message || '服务器内部错误'
      };
    }
  }
};
