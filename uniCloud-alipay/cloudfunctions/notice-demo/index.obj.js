const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  _before: async function () {
  
  },

  // 创建公告
  createNotice: async function (params) {
    const {
      community_id,
      title,
      content,
      notice_type = 'general',
      priority = 2,
      target_audience = ["all"],
      target_buildings = [],
      images = [],
      attachments = [],
      is_top = false,
      expire_time
    } = params;

    if (!community_id || !title || !content) {
      throw new Error('社区ID、标题和内容为必填项');
    }
    if (title.length < 2 || title.length > 100) {
      throw new Error('标题长度必须在2-100字之间');
    }
    if (content.length < 10 || content.length > 2000) {
      throw new Error('内容长度必须在10-2000字之间');
    }

    // 使用 'notice' 集合
    const res = await db.collection('notice').add({
      community_id,
      title,
      content,
      notice_type,
      priority,
      publish_user_id: "687de55fbece7bc449a71988", // 建议这个ID后续也改为动态获取
      target_audience,
      target_buildings,
      images,
      attachments,
      is_top,
      status: 0,
      expire_time: expire_time ? new Date(expire_time) : null,
      view_count: 0,
      publish_time: new Date(), // 补充 publish_time 字段
      create_time: new Date(),
      update_time: new Date()
    });

    return {
      code: 0,
      msg: '公告创建成功',
      data: res.id
    };
  },

  // 查询公告列表
  getNotices: async function (params) {
    const {
      community_id,
      status,
      page = 1,
      pageSize = 10,
      notice_type,
      is_top
    } = params;

    // FIX: 将 'notices' 修改为 'notice'
    let query = db.collection('notice')
      .where({
        community_id: community_id || dbCmd.exists(true),
        status: status !== undefined ? status : dbCmd.neq(3)
      });

    if (notice_type) {
      query = query.where({ notice_type });
    }
    if (is_top !== undefined) {
      query = query.where({ is_top });
    }

    const skip = (page - 1) * pageSize;

    const res = await query
      .orderBy('is_top', 'desc')
      .orderBy('priority', 'asc')
      .orderBy('publish_time', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    const countRes = await query.count();

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: res.data,
        total: countRes.total,
        page,
        pageSize
      }
    };
  },

  // 获取公告详情
  getNoticeDetail: async function (params) {
    const { id } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    // FIX: 将 'notices' 修改为 'notice'
    const res = await db.collection('notice')
      .doc(id) // 使用 doc(id) 查询效率更高
      .updateAndReturn({
        view_count: dbCmd.inc(1)
      });
    
    // updateAndReturn 返回的是更新后的文档，其数据在 res.doc 中
    if (!res.doc) {
      throw new Error('公告不存在');
    }

    return {
      code: 0,
      msg: '查询成功',
      data: res.doc
    };
  },

  // 更新公告
  updateNotice: async function (params) {
    const {
      id,
      title,
      content,
      // ...其他参数
    } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    const updateData = {
      update_time: new Date() // 使用 new Date() 保证时间正确
    };
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    // ... 其他字段的更新逻辑

    // FIX: 将 'notices' 修改为 'notice'
    const res = await db.collection('notice')
      .doc(id) // 使用 doc(id)
      .update(updateData);

    return {
      code: 0,
      msg: '更新成功',
      data: res.updated
    };
  },

  // 删除公告 (保持不变)
  deleteNotice: async function (params) {
    // ...
    throw new Error('无权限删除公告');
  }
};
