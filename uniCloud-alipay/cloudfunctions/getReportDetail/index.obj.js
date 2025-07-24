// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

'use strict';
const db = uniCloud.database();

/**
 * 格式化时间
 * @param {*} timestamp 时间戳
 */
function formatTime(timestamp) {
    if (!timestamp) return '';
    let date;
    if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    return date.toISOString().split('T')[0];
}

/**
 * 获取下一天日期
 * @param {string} dateStr 日期字符串
 * @param {number} days 天数
 */
function getNextDay(dateStr, days) {
    if (!dateStr) {
        // 如果没有日期，使用当前日期
        const now = new Date();
        now.setDate(now.getDate() + days);
        return now.toISOString().split('T')[0];
    }
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * 生成处理时间线
 * @param {object} item 记录数据
 */
function generateTimeline(item) {
    const createTime = formatTime(item.createTime);

    if (item.status === '已处理') {
        return [
            {
                title: '问题上报',
                time: createTime || '已完成',
                completed: true,
                current: false
            },
            {
                title: '受理确认',
                time: getNextDay(createTime, 1),
                completed: true,
                current: false
            },
            {
                title: '处理中',
                time: getNextDay(createTime, 2),
                completed: true,
                current: false
            },
            {
                title: '处理完成',
                time: formatTime(item.processedTime) || getNextDay(createTime, 3),
                completed: true,
                current: false
            }
        ];
    } else if (item.status === '处理中') {
        return [
            {
                title: '问题上报',
                time: createTime || '已完成',
                completed: true,
                current: false
            },
            {
                title: '受理确认',
                time: getNextDay(createTime, 1),
                completed: true,
                current: false
            },
            {
                title: '处理中',
                time: getNextDay(createTime, 2),
                completed: false,
                current: true
            },
            {
                title: '待处理完成',
                time: '预计' + getNextDay(createTime, 5),
                completed: false,
                current: false
            }
        ];
    } else {
        return [
            {
                title: '问题上报',
                time: createTime || '已完成',
                completed: true,
                current: false
            },
            {
                title: '待受理',
                time: '预计' + getNextDay(createTime, 1),
                completed: false,
                current: true
            },
            {
                title: '待处理',
                time: '预计' + getNextDay(createTime, 3),
                completed: false,
                current: false
            },
            {
                title: '待完成',
                time: '预计' + getNextDay(createTime, 7),
                completed: false,
                current: false
            }
        ];
    }
}

module.exports = {
    /**
     * 获取问题上报详情
     * @param {object} params 查询参数
     * @param {string} params.id 记录ID
     */
    async getReportDetail(params) {
        console.log('getReportDetail 接收到参数：', params);

        try {
            const { id } = params;

            // 基础校验
            if (!id) {
                throw new Error('记录ID不能为空');
            }

            const allReportCol = db.collection('ALL_Report'); // 使用与add-report-demo一致的表名

            console.log('查询记录详情，ID：', id);

            // 先查看数据库中是否有数据（调试用）
            const debugResult = await allReportCol.limit(5).get();
            console.log('=== 数据库调试信息 ===');
            console.log('数据库中总记录数（前5条）：', debugResult.data?.length || 0);
            if (debugResult.data && debugResult.data.length > 0) {
                console.log('记录ID列表：', debugResult.data.map(item => item._id));
            }

            // 获取详细记录
            const result = await allReportCol
                .where({ _id: id })
                .get();

            console.log('详情查询结果：', result.data?.length || 0, '条记录');

            if (result.data.length === 0) {
                console.log('记录不存在，查询ID：', id);
                return {
                    code: 404,
                    message: '记录不存在',
                    data: null
                };
            }

            const item = result.data[0];
            console.log('查询到的记录：', JSON.stringify(item, null, 2));

            // 计算进度百分比
            let progress = 25;
            if (item.status === '待处理') {
                progress = 25;
            } else if (item.status === '处理中') {
                progress = 60;
            } else if (item.status === '已处理') {
                progress = 100;
            }

            // 生成处理时间线
            const timelineSteps = generateTimeline(item);

            // 格式化详情数据
            const detailData = {
                id: item._id,
                title: item.description?.substring(0, 20) + (item.description?.length > 20 ? '...' : '') || '问题上报',
                description: item.description || '暂无描述',
                status: item.status || '待处理',
                progress: progress,
                category: item.category || '其他问题',
                priority: item.priority || 2,

                // 时间信息
                createTime: formatTime(item.createTime),
                reportTime: formatTime(item.reportTime),
                processedTime: formatTime(item.processedTime),

                // 用户信息
                userPhone: item.userPhone || '',
                userName: item.userName || '',
                userAddress: item.userAddress || '',
                isAnonymous: item.isAnonymous || false,

                // 位置信息
                locationInfo: item.locationInfo || {},

                // 图片信息
                imageUrls: item.imageUrls || [],

                // 处理信息
                processingNotes: item.processingNotes || '',
                processedBy: item.processedBy || '',

                // 时间线
                timeline: timelineSteps
            };

            console.log('返回的详情数据：', JSON.stringify(detailData, null, 2));

            return {
                code: 200,
                message: '获取详情成功',
                data: detailData
            };

        } catch (e) {
            console.error('getReportDetail 出错：', e);
            return {
                code: 500,
                message: e.message || '服务器内部错误',
                data: null
            };
        }
    }
}; 