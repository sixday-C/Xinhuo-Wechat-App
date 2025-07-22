// 测试获取反馈详情
//getFeedbackDetail("68764b8714f32b69e2d634aa")

// 测试获取反馈列表
// getFeedbackList({
//   community_id: "test_community_id",
//   status: 0,
//   page: 1,
//   limit: 10
// })

//测试创建反馈
createFeedback({
  content: "测试用数据1",
  category: "设施报修",
  address: {
    name: "小区东门",
    latitude: 39.908722,
    longitude: 116.397496
  },
  images: ["image1.jpg", "image2.jpg"],
  contact: "13800138000",
  community_id: "test_community_id"
})

// 测试更新反馈状态
// updateFeedbackStatus("687656f9dc910cb46eb1e961", 1, {
//   operator_name: "物业管理员",
//   notes: "已安排维修人员处理"
// })

// 测试指派处理人员
// assignFeedback("68764b8714f32b69e2d634aa", "maintenance_user_id", {
//   operator_name: "物业管理员",
//   notes: "已分配给维修部门张师傅"
// })

// 测试设置优先级
// setFeedbackPriority("68764b8714f32b69e2d634aa", 1)

// 测试用户满意度评价
// rateFeedback("68764b8714f32b69e2d634aa", 5, "处理很及时，维修质量很好，非常满意！")

// 测试添加回复
// addReply("68764b8714f32b69e2d634aa", "您好，我们已收到您的反馈，正在安排维修人员处理，预计明天上午完成修复。")

// 测试更新时间线
// updateFeedbackTimeline("687656f9dc910cb46eb1e961", "processing", {
//   operator_name: "维修人员",
//   notes: "正在更换路灯灯泡"
// })

// 测试获取统计信息
// getFeedbackStatistics("test_community_id")

// 测试数据验证
// validateFeedbackData({
//   community_id: "test_community_id",
//   user_id: "test_user_id",
//   content: "测试反馈内容",
//   category: "设施报修",
//   contact: "13800138000",
//   images: ["img1.jpg", "img2.jpg"]
// })

// 测试初始化时间线（用于数据迁移）
// initFeedbackTimeline("687656f9dc910cb46eb1e961", "test_user_id")