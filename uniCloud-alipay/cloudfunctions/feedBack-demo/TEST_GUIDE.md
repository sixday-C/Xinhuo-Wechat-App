# 反馈系统测试指南

## 测试文件说明

### 1. `feedBack-demo.param.js`
- 包含所有可用函数的测试调用
- 大部分测试用例已注释，可以逐个取消注释测试
- 适合全面的功能测试

### 2. `workflow-test.param.js`
- 完整的反馈处理流程测试
- 按照实际业务流程顺序排列
- 适合验证业务逻辑的完整性

### 3. `quick-test.param.js`
- 快速功能验证
- 简化的测试用例
- 适合快速验证某个功能是否正常

## 测试步骤建议

### 第一阶段：基础功能测试
1. 使用 `getFeedbackDetail` 测试查询功能
2. 使用 `getFeedbackList` 测试列表功能
3. 使用 `createFeedback` 创建测试数据

### 第二阶段：处理流程测试
1. 创建新的反馈记录
2. 指派处理人员
3. 更新处理状态
4. 添加回复
5. 完成处理
6. 用户评价

### 第三阶段：管理功能测试
1. 设置优先级
2. 获取统计信息
3. 数据验证
4. 时间线管理

## 测试用例示例

### 创建反馈测试
```javascript
createFeedback({
  content: "测试反馈内容，需要至少5个字符",
  category: "设施报修",
  address: {
    name: "测试位置",
    latitude: 39.908722,
    longitude: 116.397496
  },
  contact: "13800138000",
  community_id: "test_community"
})
```

### 状态更新测试
```javascript
updateFeedbackStatus("反馈ID", 1, {
  operator_name: "测试管理员",
  notes: "开始处理该反馈"
})
```

### 满意度评价测试
```javascript
rateFeedback("反馈ID", 5, "处理很满意，问题解决得很好")
```

## 注意事项

1. **反馈ID替换**：测试时请将 `"68764b8714f32b69e2d634aa"` 替换为实际的反馈ID
2. **数据验证**：注意各字段的长度和格式要求
3. **权限测试**：当前权限校验已弱化，便于测试
4. **状态流转**：状态只能向前流转（0→1→2→3）
5. **时间线自动更新**：状态变更会自动更新时间线

## 常见测试场景

### 场景1：完整的反馈处理流程
1. 用户提交反馈
2. 管理员查看并指派
3. 处理人员接收并处理
4. 用户确认并评价

### 场景2：批量数据操作
1. 创建多个不同类型的反馈
2. 按条件查询和筛选
3. 批量更新状态
4. 生成统计报告

### 场景3：异常情况处理
1. 无效数据验证
2. 权限验证
3. 状态异常处理
4. 时间线修复

## 测试建议

1. **逐步测试**：先测试基础功能，再测试复杂流程
2. **数据准备**：准备不同类型的测试数据
3. **结果验证**：每次测试后验证返回结果
4. **异常测试**：测试边界条件和异常情况
5. **性能测试**：测试大量数据时的性能表现
