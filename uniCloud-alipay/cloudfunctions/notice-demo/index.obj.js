const db = uniCloud.database();
const dbCmd = db.command;

// 将cloud://格式的图片URL转换为可访问的HTTP URL
async function convertImageUrls(images) {
  if (!images || images.length === 0) {
    return [];
  }

  try {
    const cloudImageUrls = images.filter(url => url.startsWith('cloud://'));
    if (cloudImageUrls.length === 0) {
      return images;
    }

    const result = await uniCloud.getTempFileURL({
      fileList: cloudImageUrls
    });

    return images.map(originalUrl => {
      if (originalUrl.startsWith('cloud://')) {
        const converted = result.fileList.find(file => file.fileID === originalUrl);
        return converted ? converted.tempFileURL : originalUrl;
      }
      return originalUrl;
    });
  } catch (error) {
    console.error('图片URL转换失败:', error);
    return images;
  }
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hour = ('0' + date.getHours()).slice(-2);
  const minute = ('0' + date.getMinutes()).slice(-2);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 生成摘要
function generateSummary(content, maxLength = 150) {
  if (!content) return '';
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
}

module.exports = {
  _before: async function () {

  },

  // 创建公告
  createNotice: async function (params) {
    const {
      community_id,
      title,
      content,
      summary,
      notice_type = 'general',
      priority = 2,
      target_audience = ["all"],
      target_buildings = [],
      images = [],
      cover_image,
      attachments = [],
      is_top = false,
      is_important = false,
      allow_comment = true,
      expire_time,
      tags = [],
      publish_user_id,
      publisher_name,
      status = 0
    } = params;

    // 基础验证
    if (!community_id || !title || !content) {
      throw new Error('社区ID、标题和内容为必填项');
    }
    if (title.length < 2 || title.length > 200) {
      throw new Error('标题长度必须在2-200字之间');
    }
    if (content.length < 10 || content.length > 5000) {
      throw new Error('内容长度必须在10-5000字之间');
    }

    // 如果没有提供摘要，自动生成
    const finalSummary = summary || generateSummary(content);

    const noticeData = {
      community_id,
      title,
      content,
      summary: finalSummary,
      notice_type,
      priority,
      publish_user_id: publish_user_id || "687de55fbece7bc449a71988",
      publisher_name: publisher_name || "系统管理员",
      target_audience,
      target_buildings,
      images,
      cover_image: cover_image || (images.length > 0 ? images[0] : null),
      attachments,
      is_top,
      is_important,
      allow_comment,
      status,
      expire_time: expire_time ? new Date(expire_time) : null,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      tags,
      publish_time: status === 1 ? new Date() : null,
      create_time: new Date(),
      update_time: new Date()
    };

    const res = await db.collection('notice').add(noticeData);

    return {
      code: 0,
      msg: '公告创建成功',
      data: res.id
    };
  },

  // 获取公告列表
  getNotices: async function (params) {
    const {
      community_id,
      status,
      page = 1,
      pageSize = 10,
      notice_type,
      is_top,
      is_important,
      keyword,
      sort_by = 'time' // time, hot, top
    } = params;

    let whereCondition = {
      community_id: community_id || dbCmd.exists(true),
      status: status !== undefined ? status : dbCmd.neq(3)
    };

    // 添加各种筛选条件
    if (notice_type) {
      whereCondition.notice_type = notice_type;
    }
    if (is_top !== undefined) {
      whereCondition.is_top = is_top;
    }
    if (is_important !== undefined) {
      whereCondition.is_important = is_important;
    }

    // 关键字搜索
    if (keyword) {
      whereCondition.$or = [
        { title: new RegExp(keyword, 'i') },
        { content: new RegExp(keyword, 'i') },
        { summary: new RegExp(keyword, 'i') }
      ];
    }

    let query = db.collection('notice').where(whereCondition);

    const skip = (page - 1) * pageSize;

    // 根据排序方式选择
    if (sort_by === 'hot') {
      query = query.orderBy('view_count', 'desc').orderBy('like_count', 'desc');
    } else if (sort_by === 'top') {
      query = query.orderBy('is_top', 'desc').orderBy('priority', 'asc');
    } else {
      query = query.orderBy('is_top', 'desc').orderBy('priority', 'asc').orderBy('publish_time', 'desc');
    }

    const res = await query.skip(skip).limit(pageSize).get();
    const countRes = await db.collection('notice').where(whereCondition).count();

    // 处理返回数据，转换图片URL
    const processedList = [];
    for (const item of res.data) {
      // 转换封面图片URL
      let coverImageUrl = null;
      if (item.cover_image) {
        const coverUrls = await convertImageUrls([item.cover_image]);
        coverImageUrl = coverUrls[0];
      }

      // 转换所有图片URL（用于详情页）
      const httpImageUrls = await convertImageUrls(item.images || []);

      processedList.push({
        ...item,
        cover_image_url: coverImageUrl,
        http_image_urls: httpImageUrls,
        formatted_publish_time: formatTime(item.publish_time),
        formatted_create_time: formatTime(item.create_time)
      });
    }

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: processedList,
        total: countRes.total,
        page,
        pageSize
      }
    };
  },


  // 获取公告详情
  getNoticeDetail: async function (params) {
    const { id, increment = true } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    let noticeDoc;

    try {
      if (increment) {
        // 如果需要增加次数，则执行 updateAndReturn
        const res = await db.collection('notice')
          .doc(id)
          .updateAndReturn({
            view_count: dbCmd.inc(1)
          });
        noticeDoc = res.doc;
      } else {
        // 如果不需要增加次数，则只执行 get
        const res = await db.collection('notice').doc(id).get();
        noticeDoc = res.data && res.data.length > 0 ? res.data[0] : null;
      }

      if (!noticeDoc) {
        throw new Error('公告不存在');
      }

      // 转换图片URLs
      const httpImageUrls = await convertImageUrls(noticeDoc.images || []);

      // 转换封面图片URL
      let coverImageUrl = null;
      if (noticeDoc.cover_image) {
        const coverUrls = await convertImageUrls([noticeDoc.cover_image]);
        coverImageUrl = coverUrls[0];
      }

      // 处理附件URLs（如果有的话）
      let processedAttachments = [];
      if (noticeDoc.attachments && noticeDoc.attachments.length > 0) {
        for (const attachment of noticeDoc.attachments) {
          if (typeof attachment === 'object' && attachment.file_id) {
            try {
              const fileUrls = await convertImageUrls([attachment.file_id]);
              processedAttachments.push({
                ...attachment,
                file_url: fileUrls[0]
              });
            } catch (error) {
              console.error('附件URL转换失败:', error);
              processedAttachments.push(attachment);
            }
          } else {
            processedAttachments.push(attachment);
          }
        }
      }

      const processedData = {
        ...noticeDoc,
        http_image_urls: httpImageUrls,
        cover_image_url: coverImageUrl,
        processed_attachments: processedAttachments,
        formatted_publish_time: formatTime(noticeDoc.publish_time),
        formatted_create_time: formatTime(noticeDoc.create_time),
        formatted_update_time: formatTime(noticeDoc.update_time)
      };

      return {
        code: 0,
        msg: '查询成功',
        data: processedData
      };
    } catch (error) {
      console.error('获取公告详情失败:', error);
      throw new Error(error.message || '获取公告详情失败');
    }
  },

  // ... updateNotice, deleteNotice 等其他函数保持不变 ...
  updateNotice: async function (params) {
    const {
      id,
      title,
      content,
    } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    const updateData = {
      update_time: new Date()
    };
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const res = await db.collection('notice')
      .doc(id)
      .update(updateData);

    return {
      code: 0,
      msg: '更新成功',
      data: res.updated
    };
  },

  deleteNotice: async function (params) {
    throw new Error('无权限删除公告');
  },

  // 点赞/取消点赞公告
  likeNotice: async function (params) {
    const { id, user_id, action = 'like' } = params; // action: 'like' 或 'unlike'

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    try {
      if (action === 'like') {
        // 增加点赞数
        await db.collection('notice')
          .doc(id)
          .update({
            like_count: dbCmd.inc(1)
          });

        return {
          code: 0,
          msg: '点赞成功',
          data: { action: 'liked' }
        };
      } else {
        // 减少点赞数
        await db.collection('notice')
          .doc(id)
          .update({
            like_count: dbCmd.inc(-1)
          });

        return {
          code: 0,
          msg: '取消点赞成功',
          data: { action: 'unliked' }
        };
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw new Error('点赞操作失败');
    }
  },

  // 发布公告（将草稿状态改为已发布）
  publishNotice: async function (params) {
    const { id } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    try {
      const res = await db.collection('notice')
        .doc(id)
        .update({
          status: 1,
          publish_time: new Date(),
          update_time: new Date()
        });

      return {
        code: 0,
        msg: '公告发布成功',
        data: res.updated
      };
    } catch (error) {
      console.error('发布公告失败:', error);
      throw new Error('发布公告失败');
    }
  }
};
