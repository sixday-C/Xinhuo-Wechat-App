// 本文件中的内容将在云对象【运行】时解析为运行参数
// 配置教程参考：https://uniapp.dcloud.net.cn/uniCloud/rundebug.html#run-obj-param

// 测试创建公告（带图片）
createNotice({
	"community_id": "default",
	"title": "🖼️ 测试图片公告",
	"content": "这是一个包含图片的测试公告，用于验证图片显示功能是否正常工作。包含多张测试图片，点击可以预览大图。",
	"summary": "测试图片功能的公告摘要",
	"notice_type": "general",
	"priority": 1,
	"is_top": true,
	"is_important": true,
	"images": [
		"https://via.placeholder.com/600x400/007AFF/FFFFFF?text=封面图片",
		"https://via.placeholder.com/600x400/FF3333/FFFFFF?text=图片2",
		"https://via.placeholder.com/600x400/33CC33/FFFFFF?text=图片3"
	],
	"status": 1,
	"allow_comment": true
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