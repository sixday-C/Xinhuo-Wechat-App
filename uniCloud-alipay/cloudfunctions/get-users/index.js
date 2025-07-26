'use strict';
const db = uniCloud.database();
exports.main = async () => {
  const res = await db.collection('demo-user').field({
    name: true,
    phone: true,
    address: true
  }).get();
  return { code: 0, data: res.data };
};