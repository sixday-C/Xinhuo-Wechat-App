const crypto = require('crypto')
const createConfig = require('uni-config-center')
const config = createConfig({
  pluginId: 'uni-cms'
}).config()

const unlockRecordDBName = 'uni-cms-unlock-record'

// 定义云函数
exports.main = async function (event) {
  // 解构 event 对象
  const {trans_id, extra: _extra, sign} = event
  let extra = {}
  try {
    extra = JSON.parse(_extra)
  } catch (e) {}

  // 如果 adConfig 或 securityKey 配置项不存在，则抛出错误引导用户配置参数
  if (!config.adConfig || !config.adConfig.securityKey) throw new Error('请先配置adConfig.securityKey')
  // 如果 extra.article_id 不存在，则返回 null
  if (!extra.article_id) return null

  // 签名验证
  const reSign = crypto.createHash('sha256').update(`${config.adConfig.securityKey}:${trans_id}`).digest('hex')
  if (sign !== reSign) {
    console.log('签名错误', `${config.adConfig.securityKey}:${trans_id}`)
    return null
  }

  // 获取数据库实例
  const db = uniCloud.database()
  // 查询解锁记录
  const unlockRecord = await db.collection(unlockRecordDBName).where({
    trans_id
  }).get()

  // 如果已经解锁过了，则返回 null
  if (unlockRecord.data.length) {
    console.log('已经解锁过了')
    return null // 已经解锁过了
  }

  // 添加解锁记录
  await db.collection(unlockRecordDBName).add({
    unique_id: extra.unique_id,
    unique_type: extra.unique_type,
    article_id: extra.article_id,
    trans_id,
    create_date: Date.now()
  })

  console.log('解锁成功')

  // 应广告规范，需返回 isValid 为 true
  return {
    isValid: true
  }
}
