// 调试数据库连接和数据状态的云函数

'use strict';
const db = uniCloud.database();

module.exports = {
    /**
     * 检查数据库连接和表状态
     */
    async checkDatabase() {
        try {
            console.log('开始检查数据库状态...');

            // 检查 ALL_Report 表
            const allReportCol = db.collection('ALL_Report');
            const allReports = await allReportCol.limit(10).get();

            console.log('ALL_Report 表查询结果：');
            console.log('- 记录总数：', allReports.data?.length || 0);
            console.log('- 前10条记录：', allReports.data);

            // 检查不同的表名变体
            const variations = ['All_Report', 'all_report', 'ALL_REPORT'];
            const results = {};

            for (const tableName of variations) {
                try {
                    const testCol = db.collection(tableName);
                    const testResult = await testCol.limit(1).get();
                    results[tableName] = {
                        success: true,
                        count: testResult.data?.length || 0,
                        sample: testResult.data?.[0] || null
                    };
                } catch (e) {
                    results[tableName] = {
                        success: false,
                        error: e.message
                    };
                }
            }

            return {
                code: 200,
                message: '数据库检查完成',
                data: {
                    mainTable: {
                        name: 'ALL_Report',
                        count: allReports.data?.length || 0,
                        records: allReports.data || []
                    },
                    tableVariations: results,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (e) {
            console.error('数据库检查失败：', e);
            return {
                code: 500,
                message: e.message || '数据库检查失败',
                data: null
            };
        }
    },

    /**
     * 根据手机号查询用户数据
     */
    async checkUserData(phone) {
        try {
            if (!phone) {
                throw new Error('手机号不能为空');
            }

            console.log('检查用户数据，手机号：', phone);

            // 查询 ALL_Report 表
            const allReportCol = db.collection('ALL_Report');

            // 尝试不同的查询条件
            const queries = [
                { userPhone: phone },
                { phone: phone },
                { mobile: phone }
            ];

            const results = {};

            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                const fieldName = Object.keys(query)[0];

                try {
                    const result = await allReportCol.where(query).get();
                    results[fieldName] = {
                        success: true,
                        count: result.data?.length || 0,
                        records: result.data || []
                    };
                    console.log(`字段 ${fieldName} 查询结果：${result.data?.length || 0} 条记录`);
                } catch (e) {
                    results[fieldName] = {
                        success: false,
                        error: e.message
                    };
                }
            }

            // 查询所有记录（限制10条）看看字段结构
            const allRecords = await allReportCol.limit(10).get();

            return {
                code: 200,
                message: '用户数据检查完成',
                data: {
                    phone: phone,
                    queryResults: results,
                    sampleRecords: allRecords.data || [],
                    timestamp: new Date().toISOString()
                }
            };

        } catch (e) {
            console.error('用户数据检查失败：', e);
            return {
                code: 500,
                message: e.message || '用户数据检查失败',
                data: null
            };
        }
    }
}; 