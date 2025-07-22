'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
    console.log('接收到问题上报数据：', event);
    
    try {
        // 数据验证
        if (!event.description || event.description.trim() === '') {
            return {
                success: false,
                error: '问题描述不能为空'
            };
        }
        
        // 构建要插入的数据
        const reportData = {
            description: event.description.trim(),
            isAnonymous: Boolean(event.isAnonymous),
            imageUrls: event.imageUrls || [],
            userPhone: event.userPhone || '',
            userName: event.userName || '',
            userAddress: event.userAddress || '',
            locationInfo: event.locationInfo || null,
            reportTime: event.reportTime || new Date().toISOString(),
            status: '待处理', // 默认状态
            createTime: new Date(),
            updateTime: new Date()
        };
        
        // 插入数据到数据库
        const result = await db.collection('problem_reports').add(reportData);
        
        console.log('问题上报插入成功：', result);
        
        return {
            success: true,
            data: {
                id: result.id,
                ...reportData
            },
            message: '问题上报成功'
        };
        
    } catch (error) {
        console.error('问题上报失败：', error);
        return {
            success: false,
            error: error.message || '系统错误，请稍后重试'
        };
    }
};
