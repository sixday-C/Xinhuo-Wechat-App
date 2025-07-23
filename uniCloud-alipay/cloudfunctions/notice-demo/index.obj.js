const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  _before: async function () {
  
  },

  // ... createNotice, getNotices 等其他函数保持不变 ...
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

    const res = await db.collection('notice').add({
      community_id,
      title,
      content,
      notice_type,
      priority,
      publish_user_id: "687de55fbece7bc449a71988",
      target_audience,
      target_buildings,
      images,
      attachments,
      is_top,
      status: 0,
      expire_time: expire_time ? new Date(expire_time) : null,
      view_count: 0,
      publish_time: new Date(),
      create_time: new Date(),
      update_time: new Date()
    });

    return {
      code: 0,
      msg: '公告创建成功',
      data: res.id
    };
  },

  getNotices: async function (params) {
    const {
      community_id,
      status,
      page = 1,
      pageSize = 10,
      notice_type,
      is_top
    } = params;

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


  // FIX: getNoticeDetail 函数已更新
  getNoticeDetail: async function (params) {
    // 增加一个 increment 参数，默认为 true
    const { id, increment = true } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    let noticeDoc;

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

    return {
      code: 0,
      msg: '查询成功',
      data: noticeDoc
    };
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
  }
};
