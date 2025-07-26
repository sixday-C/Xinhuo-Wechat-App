// 云函数 download_url 的 index.js
'use strict';
exports.main = async (event, context) => {
  // event 就是前端传来的 fileList
  return await uniCloud.getTempFileURL({
    fileList: event.fileList || []
  });
};
