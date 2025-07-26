const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  _before: async function () {

  },

  // 统一入口方法，根据action参数调用对应的方法
  async main(params) {
    const { action, ...data } = params

    switch (action) {
      case 'createNotice':
        return await this.createNotice(data)
      case 'getNotices':
        return await this.getNotices(data)
      case 'getNoticeDetail':
        return await this.getNoticeDetail(data)
      case 'updateNotice':
        return await this.updateNotice(data)
      case 'deleteNotice':
        return await this.deleteNotice(data)
      case 'likeNotice':
        return await this.likeNotice(data)
      default:
        throw new Error(`未知的操作类型: ${action}`)
    }
  },
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
      expire_time,
      status = 0,
      publish_time,
      create_time,
      update_time
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

    const noticeData = {
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
      status,
      expire_time: expire_time ? new Date(expire_time) : null,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      publish_time: publish_time ? new Date(publish_time) : new Date(),
      create_time: create_time ? new Date(create_time) : new Date(),
      update_time: update_time ? new Date(update_time) : new Date()
    };

    const res = await db.collection('notice').add(noticeData);

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
      is_top,
      keyword,
      sort_field = 'publish_time',
      sort_order = 'desc'
    } = params;

    let whereConditions = {
      community_id: community_id || dbCmd.exists(true),
      status: status !== undefined ? status : dbCmd.neq(3)
    };

    if (notice_type) {
      whereConditions.notice_type = notice_type;
    }
    if (is_top !== undefined) {
      whereConditions.is_top = is_top;
    }

    // 关键词搜索（标题和内容）
    if (keyword && keyword.trim()) {
      whereConditions.$or = [
        { title: new RegExp(keyword.trim(), 'i') },
        { content: new RegExp(keyword.trim(), 'i') }
      ];
    }

    let query = db.collection('notice').where(whereConditions);

    const skip = (page - 1) * pageSize;

    // 动态排序
    const sortOptions = {};
    if (is_top !== undefined) {
      sortOptions.is_top = 'desc';
    }
    sortOptions[sort_field] = sort_order;
    sortOptions.priority = 'asc';

    // 添加排序
    Object.entries(sortOptions).forEach(([field, order]) => {
      query = query.orderBy(field, order);
    });

    const res = await query
      .skip(skip)
      .limit(pageSize)
      .get();

    const countRes = await query.count();

    // 处理返回数据，确保所有字段都返回
    const list = res.data.map(item => ({
      ...item,
      tags: item.tags || [],
      like_count: item.like_count || 0,
      comment_count: item.comment_count || 0,
      allow_comment: item.allow_comment !== false,
      is_important: item.is_important || false,
      publisher_name: item.publisher_name || '管理员',
      summary: item.summary || item.content.substring(0, 100)
    }));

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list,
        total: countRes.total,
        page,
        pageSize
      }
    };
  },

  // 获取公告详情
  getNoticeDetail: async function (params) {
    const { id, increment = false } = params;

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

  updateNotice: async function (params) {
    const {
      id,
      title,
      content,
      notice_type,
      priority,
      target_audience,
      target_buildings,
      images,
      attachments,
      is_top,
      expire_time,
      status
    } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    // 构建更新数据
    const updateData = {
      update_time: new Date()
    };

    if (title !== undefined) {
      if (title.length < 2 || title.length > 100) {
        throw new Error('标题长度必须在2-100字之间');
      }
      updateData.title = title;
    }

    if (content !== undefined) {
      if (content.length < 10 || content.length > 2000) {
        throw new Error('内容长度必须在10-2000字之间');
      }
      updateData.content = content;
    }

    if (notice_type !== undefined) updateData.notice_type = notice_type;
    if (priority !== undefined) updateData.priority = priority;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (target_buildings !== undefined) updateData.target_buildings = target_buildings;
    if (images !== undefined) updateData.images = images;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (is_top !== undefined) updateData.is_top = is_top;
    if (expire_time !== undefined) updateData.expire_time = expire_time ? new Date(expire_time) : null;
    if (status !== undefined) updateData.status = status;

    const res = await db.collection('notice')
      .doc(id)
      .update(updateData);

    return {
      code: 0,
      msg: '更新成功',
      data: {
        updated: res.updated,
        id: id
      }
    };
  },

  deleteNotice: async function (params) {
    const { id, ids } = params;

    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      throw new Error('请提供要删除的公告ID');
    }

    let deleteIds = [];
    if (id) {
      deleteIds = [id];
    } else {
      deleteIds = ids;
    }

    // 批量删除
    const promises = deleteIds.map(deleteId => {
      return db.collection('notice').doc(deleteId).remove();
    });

    const results = await Promise.all(promises);
    const deletedCount = results.reduce((count, result) => count + result.deleted, 0);

    return {
      code: 0,
      msg: `成功删除 ${deletedCount} 条公告`,
      data: {
        deleted: deletedCount,
        ids: deleteIds
      }
    };
  },

  // 点赞功能
  likeNotice: async function (params) {
    const { id } = params;

    if (!id) {
      throw new Error('公告ID不能为空');
    }

    // 增加点赞数
    const res = await db.collection('notice').doc(id).update({
      like_count: dbCmd.inc(1),
      update_time: new Date()
    });

    return {
      code: 0,
      msg: '点赞成功',
      data: {
        updated: res.updated,
        id: id
      }
    };
  }
};
