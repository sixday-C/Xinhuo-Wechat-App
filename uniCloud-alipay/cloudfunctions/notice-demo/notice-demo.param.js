// 本文件中的内容将在云对象【运行】时解析为运行参数
// 配置教程参考：https://uniapp.dcloud.net.cn/uniCloud/rundebug.html#run-obj-param

// 测试创建公告
createNotice({
	"community_id": "default",
	"title": "测试文章标题",
	"content": "这是一个测试文章的内容，用于验证公告创建功能是否正常工作。",
	"notice_type": "general",
	"priority": 2,
	"is_top": false,
	"images": [],
	"status": 1,
	"like_count": 0,
	"comment_count": 0
})

// 测试获取公告列表
// getNotices({
// 	"community_id": "default",
// 	"page": 1,
// 	"pageSize": 10
// })

// 测试获取公告详情
// getNoticeDetail({
// 	"id": "公告ID",
// 	"increment": false
// })

// 测试点赞功能
// likeNotice({
// 	"id": "公告ID"
// })