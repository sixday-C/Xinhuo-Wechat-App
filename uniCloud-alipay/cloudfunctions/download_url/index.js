'use strict';
const uniCloud = require('uni-cloud');
exports.main = async (event) => {
  // 兼容 GET / POST
  const fileList = Array.isArray(event.fileList)
    ? event.fileList
    : (event.queryStringParameters?.fileList || []);
  if (!fileList.length) return { code: 0, fileList: [] };

  const res = await uniCloud.getTempFileURL({ fileList });
  return { code: 0, fileList: res.fileList || [] };
};