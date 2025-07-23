function parseScanResult (scanText) {
  const match = scanText.match(/^(.*?):\/\/(.*)/)

  if (!match || match.length < 1) {
    uni.showToast({
      icon: 'none',
      title: '未能识别到有效信息'
    })
  }

  const [, protocol, path] = match

  switch (protocol) {
    case "internallink":
      uni.navigateTo({
        url: `/${path.replace(/^\//, '')}`,
        fail: () => {
          uni.showToast({
            icon: "none",
            title: "访问的路径不存在"
          })
        }
      })
      break
  }
}

export default parseScanResult
