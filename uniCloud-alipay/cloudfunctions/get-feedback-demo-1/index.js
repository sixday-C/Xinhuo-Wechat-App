'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  /**
   * 通用预处理器
   */
  _before: function () {
    // 弱化权限校验，便于开发测试
    try {
      const clientInfo = this.getClientInfo();
      if (clientInfo.uniIdToken) {
        const { uid } = uniCloud.auth().getUserInfo();
        this.currentUserId = uid;
      } else {
        // 如果没有登录，使用测试用户ID
        this.currentUserId = 'test_user_id';
      }
    } catch (e) {
      console.log('权限校验跳过，使用测试模式');
      this.currentUserId = 'test_user_id';
    }
  },

  /**
   * 获取反馈详情及进度时间线
   * @param {String} feedbackId - 反馈记录ID
   * @returns {Object} - 反馈详情和时间线
   */
  async getFeedbackDetail(feedbackId) {
    // 参数校验
    if (!feedbackId) {
      throw new Error('反馈ID不能为空');
    }

    try {
      // 查询反馈记录
      const feedbackCollection = db.collection('feedBack');
      const feedbackRes = await feedbackCollection.doc(feedbackId).get();
      if (!feedbackRes.data.length) {
        throw new Error('反馈记录不存在');
      }
      const feedback = feedbackRes.data[0];

      // 弱化权限校验 - 仅做基本检查
      // const userCollection = db.collection('uni-id-users');
      // 这里可以添加更详细的权限校验逻辑，目前先弱化处理

      // 查询回复记录
      const replyCollection = db.collection('reply');
      const replyRes = await replyCollection
        .where({ feedback_id: feedbackId })
        .orderBy('create_time', 'asc')
        .get();
      const replies = replyRes.data || [];

      // 状态映射
      const statusMap = {
        0: '待处理',
        1: '处理中', 
        2: '已解决',
        3: '已关闭'
      };

      // 分类映射（根据 feedBack.schema.json 中的 enum 值）
      const categoryMap = {
        '设施报修': '设施报修',
        '环境卫生': '环境卫生',
        '安全隐患': '安全隐患',
        '邻里纠纷': '邻里纠纷',
        '其他': '其他'
      };

      // 计算进度百分比
      const getProgress = (status) => {
        const progressMap = {
          0: 25,   // 待处理
          1: 50,   // 处理中
          2: 100,  // 已解决
          3: 100   // 已关闭
        };
        return progressMap[status] || 0;
      };

      // 格式化时间 - 处理 timestamp 类型
      const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // 如果是 timestamp 类型，可能需要特殊处理
        let date;
        if (typeof timestamp === 'number') {
          date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
          date = timestamp;
        } else {
          date = new Date(timestamp);
        }
        return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
      };

      // 构建时间线 - 使用数据库中的 timeline 字段
      let timeline = [];
      
      if (feedback.timeline && Array.isArray(feedback.timeline)) {
        // 如果数据库中有时间线数据，直接使用
        timeline = feedback.timeline.map(item => ({
          title: item.stage_name || this.getStageDisplayName(item.stage),
          time: formatDate(item.timestamp),
          completed: item.completed || false,
          operator: item.operator_name || '',
          notes: item.notes || ''
        }));
      } else {
        // 如果没有时间线数据，根据状态和回复生成默认时间线
        timeline = this.generateDefaultTimeline(feedback, replies, formatDate);
      }

      // 处理图片URL - 这里需要根据实际的文件存储服务来转换
      const processImages = (images) => {
        if (!images || !Array.isArray(images)) return [];
        return images.map(imageId => {
          // 这里需要根据实际的云存储服务来转换文件ID为URL
          // 临时返回示例URL，实际应该调用云存储服务获取真实URL
          return `https://example.com/files/${imageId}`;
        });
      };

      // 构建返回数据
      const result = {
        id: feedback._id,
        title: feedback.content.length > 20 ? feedback.content.substring(0, 20) + '...' : feedback.content,
        date: formatDate(feedback.create_time),
        status: statusMap[feedback.status] || '待处理',
        progress: getProgress(feedback.status),
        type: categoryMap[feedback.category] || '其他',
        location: feedback.address?.name || '小区公共区域',
        description: feedback.content,
        contact: feedback.contact || '',
        images: processImages(feedback.images),
        timeline: timeline
      };

      return result;

    } catch (e) {
      console.error('数据库查询失败:', e);
      return {
        code: 500,
        message: `服务端错误: ${e.message}`
      };
    }
  },

  /**
   * 获取反馈列表
   * @param {Object} params - 查询参数
   * @param {String} params.community_id - 社区ID（可选）
   * @param {Number} params.status - 状态筛选（可选）
   * @param {Number} params.page - 页码，默认1
   * @param {Number} params.limit - 每页数量，默认10
   * @returns {Object} - 反馈列表
   */
  async getFeedbackList(params = {}) {
    try {
      const {
        community_id,
        status,
        page = 1,
        limit = 10
      } = params;

      // 构建查询条件
      const where = {};
      if (community_id) {
        where.community_id = community_id;
      }
      if (status !== undefined && status !== null) {
        where.status = status;
      }

      // 查询反馈列表
      const feedbackCollection = db.collection('feedBack');
      const feedbackRes = await feedbackCollection
        .where(where)
        .orderBy('create_time', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get();

      const feedbacks = feedbackRes.data || [];

      // 状态映射
      const statusMap = {
        0: '待处理',
        1: '处理中',
        2: '已解决', 
        3: '已关闭'
      };

      // 分类映射（保持与 schema 一致）
      const categoryMap = {
        '设施报修': '设施报修',
        '环境卫生': '环境卫生',
        '安全隐患': '安全隐患',
        '邻里纠纷': '邻里纠纷',
        '其他': '其他'
      };

      // 格式化时间
      const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
      };

      // 计算进度百分比
      const getProgress = (status) => {
        const progressMap = {
          0: 25,   // 待处理
          1: 50,   // 处理中
          2: 100,  // 已解决
          3: 100   // 已关闭
        };
        return progressMap[status] || 0;
      };

      // 格式化返回数据
      const result = feedbacks.map(feedback => ({
        id: feedback._id,
        title: feedback.content.length > 20 ? feedback.content.substring(0, 20) + '...' : feedback.content,
        date: formatDate(feedback.create_time),
        status: statusMap[feedback.status] || '待处理',
        progress: getProgress(feedback.status),
        type: categoryMap[feedback.category] || '其他',
        location: feedback.address?.name || '小区公共区域'
      }));

      return {
        code: 200,
        message: '查询成功',
        data: {
          list: result,
          total: feedbacks.length,
          page: page,
          limit: limit
        }
      };

    } catch (e) {
      console.error('获取反馈列表失败:', e);
      return {
        code: 500,
        message: `服务端错误: ${e.message}`
      };
    }
  },

  /**
   * 创建反馈记录（用于测试）
   * @param {Object} params - 反馈参数
   * @returns {Object} - 创建结果
   */
  async createFeedback(params) {
    try {
      const {
        content = '测试反馈内容',
        category = '其他',
        address = { name: '小区公共区域' },
        images = [],
        community_id = 'test_community_id',
        contact = '13800138000'
      } = params;

      // 验证必填字段
      if (!content || content.length < 5 || content.length > 500) {
        throw new Error('反馈内容长度必须在5-500字之间');
      }

      // 验证分类
      const validCategories = ['设施报修', '环境卫生', '安全隐患', '邻里纠纷', '其他'];
      if (!validCategories.includes(category)) {
        throw new Error('无效的问题分类');
      }

      // 验证联系电话格式
      if (contact && !/^\d{5,20}$/.test(contact)) {
        throw new Error('联系电话格式不正确');
      }

      const feedbackData = {
        community_id,
        user_id: this.currentUserId,
        content,
        category,
        address,
        images,
        contact,
        status: 0, // 待处理
        priority: 2, // 默认中等优先级
        timeline: [{
          stage: 'submitted',
          stage_name: '问题上报',
          timestamp: new Date(),
          operator_id: this.currentUserId,
          operator_name: '用户',
          notes: '用户提交反馈',
          completed: true
        }]
        // create_time 和 update_time 由 schema 的 defaultValue 自动设置
      };

      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.add(feedbackData);

      return {
        code: 200,
        message: '创建成功',
        data: {
          id: result.id,
          ...feedbackData
        }
      };
    } catch (e) {
      console.error('创建反馈失败:', e);
      return {
        code: 500,
        message: `创建失败: ${e.message}`
      };
    }
  },

  /**
   * 更新反馈状态（用于测试）
   * @param {String} feedbackId - 反馈ID
   * @param {Number} status - 新状态
   * @param {Object} params - 额外参数
   * @returns {Object} - 更新结果
   */
  async updateFeedbackStatus(feedbackId, status, params = {}) {
    try {
      const {
        operator_name = '系统管理员',
        notes = ''
      } = params;

      // 状态对应的阶段映射
      const statusToStage = {
        0: 'submitted',
        1: 'processing',
        2: 'completed',
        3: 'closed'
      };

      // 更新反馈状态
      const feedbackCollection = db.collection('feedBack');
      const updateData = {
        status: status,
        update_time: new Date()
      };

      // 如果是完成状态，记录实际完成时间
      if (status === 2) {
        updateData.actual_completion = new Date();
      }

      const result = await feedbackCollection.doc(feedbackId).update(updateData);

      // 更新时间线
      const stage = statusToStage[status];
      if (stage) {
        await this.updateFeedbackTimeline(feedbackId, stage, {
          operator_name: operator_name,
          notes: notes || `状态更新为: ${this.getStageDisplayName(stage)}`
        });
      }

      return {
        code: 200,
        message: '状态更新成功',
        data: {
          feedbackId: feedbackId,
          newStatus: status,
          result: result
        }
      };
    } catch (e) {
      console.error('更新状态失败:', e);
      return {
        code: 500,
        message: `更新失败: ${e.message}`
      };
    }
  },

  /**
   * 添加回复记录（用于测试）
   * @param {String} feedbackId - 反馈ID
   * @param {String} content - 回复内容
   * @returns {Object} - 添加结果
   */
  async addReply(feedbackId, content) {
    try {
      const replyData = {
        feedback_id: feedbackId,
        user_id: this.currentUserId,
        content: content || '感谢您的反馈，我们会及时处理',
        reply_type: 'official',
        is_public: true,
        create_time: new Date().getTime(),
        update_time: new Date().getTime()
      };

      const replyCollection = db.collection('reply');
      const result = await replyCollection.add(replyData);

      return {
        code: 200,
        message: '回复添加成功',
        data: {
          id: result.id,
          ...replyData
        }
      };
    } catch (e) {
      console.error('添加回复失败:', e);
      return {
        code: 500,
        message: `添加回复失败: ${e.message}`
      };
    }
  },

  /**
   * 验证反馈数据
   * @param {Object} data - 反馈数据
   * @returns {Object} - 验证结果
   */
  validateFeedbackData(data) {
    const errors = [];
    
    // 验证必填字段
    if (!data.community_id) {
      errors.push('社区ID必填');
    }
    if (!data.user_id) {
      errors.push('用户ID必填');
    }
    if (!data.content) {
      errors.push('反馈内容必填');
    }
    
    // 验证内容长度
    if (data.content && (data.content.length < 5 || data.content.length > 500)) {
      errors.push('反馈内容长度必须在5-500字之间');
    }
    
    // 验证分类
    const validCategories = ['设施报修', '环境卫生', '安全隐患', '邻里纠纷', '其他'];
    if (data.category && !validCategories.includes(data.category)) {
      errors.push('无效的问题分类');
    }
    
    // 验证联系电话
    if (data.contact && !/^\d{5,20}$/.test(data.contact)) {
      errors.push('联系电话格式不正确');
    }
    
    // 验证图片数量
    if (data.images && Array.isArray(data.images) && data.images.length > 6) {
      errors.push('图片数量不能超过6张');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * 获取反馈统计信息
   * @param {String} community_id - 社区ID
   * @returns {Object} - 统计结果
   */
  async getFeedbackStatistics(community_id) {
    try {
      const feedbackCollection = db.collection('feedBack');
      
      // 构建查询条件
      const where = community_id ? { community_id } : {};
      
      // 统计各状态的反馈数量
      const statusStats = await feedbackCollection
        .where(where)
        .groupBy('status')
        .groupField('count(*) as count')
        .get();
      
      // 统计各分类的反馈数量
      const categoryStats = await feedbackCollection
        .where(where)
        .groupBy('category')
        .groupField('count(*) as count')
        .get();
      
      return {
        code: 200,
        message: '统计成功',
        data: {
          statusStats: statusStats.data || [],
          categoryStats: categoryStats.data || []
        }
      };
    } catch (e) {
      console.error('获取统计信息失败:', e);
      return {
        code: 500,
        message: `统计失败: ${e.message}`
      };
    }
  },

  /**
   * 获取阶段显示名称
   * @param {String} stage - 阶段标识
   * @returns {String} - 显示名称
   */
  getStageDisplayName(stage) {
    const stageMap = {
      'submitted': '问题上报',
      'confirmed': '受理确认',
      'processing': '处理中',
      'completed': '处理完成',
      'closed': '已关闭'
    };
    return stageMap[stage] || stage;
  },

  /**
   * 生成默认时间线（兼容旧数据）
   * @param {Object} feedback - 反馈数据
   * @param {Array} replies - 回复数据
   * @param {Function} formatDate - 时间格式化函数
   * @returns {Array} - 时间线数组
   */
  generateDefaultTimeline(feedback, replies, formatDate) {
    const timeline = [];
    
    // 添加问题上报时间线
    timeline.push({
      title: '问题上报',
      time: formatDate(feedback.create_time),
      completed: true,
      operator: '',
      notes: ''
    });

    // 根据状态和回复记录构建时间线
    if (feedback.status >= 1 || replies.length > 0) {
      timeline.push({
        title: '受理确认',
        time: replies.length > 0 ? formatDate(replies[0].create_time) : formatDate(feedback.update_time),
        completed: true,
        operator: '',
        notes: ''
      });
    }

    if (feedback.status >= 1) {
      timeline.push({
        title: '处理中',
        time: formatDate(feedback.update_time),
        completed: true,
        operator: '',
        notes: ''
      });
    }

    if (feedback.status >= 2) {
      timeline.push({
        title: feedback.status === 2 ? '处理完成' : '已关闭',
        time: formatDate(feedback.update_time),
        completed: true,
        operator: '',
        notes: ''
      });
    }

    return timeline;
  },

  /**
   * 更新反馈时间线
   * @param {String} feedbackId - 反馈ID
   * @param {String} stage - 阶段
   * @param {Object} params - 参数
   * @returns {Object} - 更新结果
   */
  async updateFeedbackTimeline(feedbackId, stage, params = {}) {
    try {
      const {
        operator_id = this.currentUserId,
        operator_name = '系统',
        notes = '',
        completed = true
      } = params;

      // 创建时间线项
      const timelineItem = {
        stage: stage,
        stage_name: this.getStageDisplayName(stage),
        timestamp: new Date(),
        operator_id: operator_id,
        operator_name: operator_name,
        notes: notes,
        completed: completed
      };

      // 更新反馈的时间线
      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.doc(feedbackId).update({
        timeline: dbCmd.push(timelineItem),
        update_time: new Date()
      });

      return {
        code: 200,
        message: '时间线更新成功',
        data: {
          timelineItem: timelineItem,
          result: result
        }
      };
    } catch (e) {
      console.error('更新时间线失败:', e);
      return {
        code: 500,
        message: `更新时间线失败: ${e.message}`
      };
    }
  },

  /**
   * 初始化反馈时间线
   * @param {String} feedbackId - 反馈ID
   * @param {String} user_id - 用户ID
   * @returns {Object} - 初始化结果
   */
  async initFeedbackTimeline(feedbackId, user_id) {
    try {
      const initialTimeline = [{
        stage: 'submitted',
        stage_name: '问题上报',
        timestamp: new Date(),
        operator_id: user_id,
        operator_name: '用户',
        notes: '用户提交反馈',
        completed: true
      }];

      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.doc(feedbackId).update({
        timeline: initialTimeline
      });

      return {
        code: 200,
        message: '时间线初始化成功',
        data: result
      };
    } catch (e) {
      console.error('初始化时间线失败:', e);
      return {
        code: 500,
        message: `初始化时间线失败: ${e.message}`
      };
    }
  },

  /**
   * 指派反馈处理人员
   * @param {String} feedbackId - 反馈ID
   * @param {String} assigned_to - 指派给的用户ID
   * @param {Object} params - 额外参数
   * @returns {Object} - 指派结果
   */
  async assignFeedback(feedbackId, assigned_to, params = {}) {
    try {
      const {
        operator_name = '管理员',
        notes = ''
      } = params;

      // 更新反馈的指派人员
      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.doc(feedbackId).update({
        assigned_to: assigned_to,
        status: 1, // 更新为处理中
        update_time: new Date()
      });

      // 更新时间线
      await this.updateFeedbackTimeline(feedbackId, 'confirmed', {
        operator_name: operator_name,
        notes: notes || '反馈已分配给处理人员'
      });

      return {
        code: 200,
        message: '指派成功',
        data: {
          feedbackId: feedbackId,
          assigned_to: assigned_to,
          result: result
        }
      };
    } catch (e) {
      console.error('指派失败:', e);
      return {
        code: 500,
        message: `指派失败: ${e.message}`
      };
    }
  },

  /**
   * 设置反馈优先级
   * @param {String} feedbackId - 反馈ID
   * @param {Number} priority - 优先级 (1-高, 2-中, 3-低)
   * @returns {Object} - 设置结果
   */
  async setFeedbackPriority(feedbackId, priority) {
    try {
      if (![1, 2, 3].includes(priority)) {
        throw new Error('无效的优先级，必须是1(高)、2(中)、3(低)');
      }

      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.doc(feedbackId).update({
        priority: priority,
        update_time: new Date()
      });

      const priorityText = { 1: '高', 2: '中', 3: '低' }[priority];
      
      // 更新时间线
      await this.updateFeedbackTimeline(feedbackId, 'processing', {
        operator_name: '管理员',
        notes: `优先级设置为: ${priorityText}`
      });

      return {
        code: 200,
        message: '优先级设置成功',
        data: {
          feedbackId: feedbackId,
          priority: priority,
          priorityText: priorityText,
          result: result
        }
      };
    } catch (e) {
      console.error('设置优先级失败:', e);
      return {
        code: 500,
        message: `设置优先级失败: ${e.message}`
      };
    }
  },

  /**
   * 用户满意度评价
   * @param {String} feedbackId - 反馈ID
   * @param {Number} rating - 评分 (1-5)
   * @param {String} feedback_text - 反馈内容
   * @returns {Object} - 评价结果
   */
  async rateFeedback(feedbackId, rating, feedback_text = '') {
    try {
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('评分必须在1-5分之间');
      }

      const feedbackCollection = db.collection('feedBack');
      const result = await feedbackCollection.doc(feedbackId).update({
        satisfaction_rating: rating,
        satisfaction_feedback: feedback_text,
        update_time: new Date()
      });

      // 更新时间线
      await this.updateFeedbackTimeline(feedbackId, 'completed', {
        operator_id: this.currentUserId,
        operator_name: '用户',
        notes: `用户评价: ${rating}分 - ${feedback_text}`
      });

      return {
        code: 200,
        message: '评价成功',
        data: {
          feedbackId: feedbackId,
          rating: rating,
          feedback_text: feedback_text,
          result: result
        }
      };
    } catch (e) {
      console.error('评价失败:', e);
      return {
        code: 500,
        message: `评价失败: ${e.message}`
      };
    }
  },
};