# 反馈系统云对象功能说明

## 主要功能

### 1. getFeedbackDetail(feedbackId)
获取反馈详情及进度时间线

**参数：**
- `feedbackId`: 反馈记录ID

**返回格式：**
```json
{
  "id": "1001",
  "title": "小区东门路灯不亮",
  "date": "2025-07-02",
  "status": "已处理",
  "progress": 100,
  "type": "设施报修",
  "location": "小区公共区域",
  "description": "东门路灯晚上不亮，影响出行。",
  "contact": "13800138000",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "timeline": [
    {
      "title": "问题上报", 
      "time": "2025-07-02", 
      "completed": true,
      "operator": "用户",
      "notes": "用户提交反馈"
    },
    {
      "title": "受理确认", 
      "time": "2025-07-03", 
      "completed": true,
      "operator": "管理员",
      "notes": "反馈已分配给处理人员"
    },
    {
      "title": "处理中", 
      "time": "2025-07-04", 
      "completed": true,
      "operator": "维修人员",
      "notes": "正在维修路灯"
    },
    {
      "title": "处理完成", 
      "time": "2025-07-05", 
      "completed": true,
      "operator": "维修人员",
      "notes": "路灯已修复"
    }
  ]
}
```

### 2. getFeedbackList(params)
获取反馈列表

### 3. createFeedback(params)
创建反馈记录（自动初始化时间线）

### 4. updateFeedbackStatus(feedbackId, status, params)
更新反馈状态（自动更新时间线）

### 5. assignFeedback(feedbackId, assigned_to, params)
指派反馈处理人员

### 6. setFeedbackPriority(feedbackId, priority)
设置反馈优先级

### 7. rateFeedback(feedbackId, rating, feedback_text)
用户满意度评价

### 8. updateFeedbackTimeline(feedbackId, stage, params)
手动更新时间线

### 9. initFeedbackTimeline(feedbackId, user_id)
初始化时间线（用于旧数据迁移）

### 10. addReply(feedbackId, content)
添加回复记录

### 11. validateFeedbackData(data)
验证反馈数据格式

### 12. getFeedbackStatistics(community_id)
获取反馈统计信息

## 🆕 新增时间线功能

### 时间线阶段：
- `submitted`: 问题上报
- `confirmed`: 受理确认 
- `processing`: 处理中
- `completed`: 处理完成
- `closed`: 已关闭

### 时间线数据结构：
```json
{
  "stage": "processing",
  "stage_name": "处理中",
  "timestamp": "2025-07-04T10:30:00Z",
  "operator_id": "user123",
  "operator_name": "维修人员",
  "notes": "正在维修路灯",
  "completed": true
}
```

## 数据库结构更新

### feedBack 表新增字段：
- `timeline`: 处理时间线数组
- `assigned_to`: 指派给的用户ID
- `priority`: 优先级（1-高，2-中，3-低）
- `estimated_completion`: 预计完成时间
- `actual_completion`: 实际完成时间
- `satisfaction_rating`: 满意度评分（1-5分）
- `satisfaction_feedback`: 满意度反馈

### 新增索引：
- `idx_assigned_priority`: 指派人员和优先级
- `idx_category_status`: 分类和状态
- `idx_priority_created`: 优先级和创建时间

## 状态说明

- 0: 待处理 (进度25%)
- 1: 处理中 (进度50%)
- 2: 已解决 (进度100%)
- 3: 已关闭 (进度100%)

## 优先级说明

- 1: 高优先级 🔴
- 2: 中优先级 🟡
- 3: 低优先级 🟢

## 使用示例

```javascript
// 创建反馈（自动初始化时间线）
const feedback = await obj.createFeedback({
  content: '电梯故障',
  category: '设施报修',
  priority: 1
});

// 指派处理人员
await obj.assignFeedback(feedback.data.id, 'maintenance_user_id', {
  operator_name: '物业管理员',
  notes: '已分配给维修部门'
});

// 更新处理状态
await obj.updateFeedbackStatus(feedback.data.id, 2, {
  operator_name: '维修人员',
  notes: '问题已解决'
});

// 用户评价
await obj.rateFeedback(feedback.data.id, 5, '处理很及时，很满意');
```

## 最新更新

✅ **完整的时间线支持**：
- 自动记录每个处理阶段
- 支持操作人员和备注信息
- 兼容旧数据的时间线生成

✅ **增强的处理流程**：
- 支持指派处理人员
- 优先级管理
- 满意度评价系统

✅ **更好的数据追踪**：
- 预计完成时间
- 实际完成时间
- 完整的操作历史

## 注意事项

1. 新的时间线功能完全向后兼容
2. 旧数据会自动生成默认时间线
3. 所有状态变更都会自动更新时间线
4. 建议在生产环境中逐步迁移数据
