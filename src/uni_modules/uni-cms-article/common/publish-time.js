export default function translatePublishTime(timestamp) {
  let result = ''
  // 获取当前时间
  const currentData = new Date()
  // 获取发布时间
  const date = new Date(timestamp)
  // 获取发布年份
  const year = date.getFullYear()
  // 获取发布月份
  const mouth = date.getMonth() + 1
  // 获取发布日期
  const day = date.getDate()
  // 获取发布小时
  const hours = date.getHours()
  // 获取发布分钟
  const minute = date.getMinutes()
  // 获取发布秒数
  const second = date.getSeconds()
  // 获取发布时间戳
  const timer = date.getTime()
  // 获取当前年份
  const currentYear = currentData.getFullYear()
  // 获取当前月份
  const currentMonth = currentData.getMonth() + 1
  // 获取当前日期
  const currentDay = currentData.getDate()
  // 获取当前小时
  const currentHours = currentData.getHours()
  // 获取当前分钟
  let currentMinute = currentData.getMinutes()
  // 获取当前秒数
  const currentSecond = currentData.getSeconds()
  // 获取当前时间戳
  const currentTimer = currentData.getTime()

  // 如果时间差小于10秒
  if ((currentTimer - timer) < 1000 * 10) {
    // 显示刚刚
    result = `刚刚`;
    // 如果时间差小于60秒
  } else if ((currentTimer - timer) < 1000 * 60) {
    // 如果当前分钟大于发布分钟
    if (currentMinute > minute) {
      // 显示秒数差
      result = `${(((currentMinute - minute) * 60) + currentSecond - second)}秒前`;
    } else {
      // 显示秒数差
      result = `${(currentSecond - second)}秒前`;
    }
    // 如果时间差小于1小时
  } else if ((currentTimer - timer) < 1000 * (60 * 60)) {
    // 如果当前小时大于发布小时
    if (currentHours > hours) {
      // 显示分钟差
      result = `${(((currentHours - hours) * 60) + currentMinute - minute)}分钟前`;
    } else {
      // 修改 昨天发布的文章时间会出现负数
      // 如果当前分钟小于发布分钟
      if (currentMinute < minute) {
        // 当前分钟加60
        currentMinute += 60
      }
      // 显示分钟差
      result = `${(currentMinute - minute)}分钟前`;
    }
    // 如果时间差小于1天
  } else if ((currentTimer - timer) < 1000 * (24 * 60 * 60)) {
    // 如果当前日期大于发布日期
    if (currentDay > day) {
      // 显示小时差
      result = `${((currentDay - day) * 24 + currentHours - hours)}小时前`;
    } else {
      // 修改 跨月-昨天发布的文章时间会出现负数
      // 如果当前月份不等于发布月份
      if (currentMonth !== mouth) {
        // 显示小时差
        result = `${(24 + currentHours - hours)}小时前`;
      } else {
        // 显示小时差
        result = `${(currentHours - hours)}小时前`;
      }
    }
    // 如果发布年份等于当前年份
  } else if (currentYear === year) {
    // 显示月份和日期
    result = `${mouth}月${day}日`;
  } else {
    // 显示年份、月份和日期
    result = `${year}年${mouth}月${day}日`;
  }
  return result // 返回结果
}

