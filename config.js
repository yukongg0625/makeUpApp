// 应用配置
module.exports = {
  // 云存储配置
  storage: {
    // 是否使用云函数获取图片临时URL
    // true: 使用云函数（开发环境，云存储权限受限时）
    // false: 直接使用 wx.cloud.getTempFileURL（生产环境，云存储权限为"所有用户可读"时）
    useCloudFunctionForImageUrl: true
  },

  // 云开发环境ID
  cloudEnv: 'cloud1-d6gmlx4ss77f8e361'
}
