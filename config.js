// 应用配置
module.exports = {
  // 云存储配置
  storage: {
    // 是否使用云函数获取图片临时URL
    // true: 使用云函数（开发环境，云存储权限受限时）
    // false: 直接使用 wx.cloud.getTempFileURL（生产环境，云存储权限为"所有用户可读"时）
    useCloudFunctionForImageUrl: true,

    // 图片URL缓存时长（毫秒），默认50分钟
    // 云存储临时URL通常1小时过期，建议设置略小于过期时间
    urlCacheTTL: 50 * 60 * 1000,

    // 图片格式优化建议：
    // 1. 上传时优先使用 WebP 格式（体积比 JPEG/PNG 小 30-50%）
    // 2. 为不同场景准备多尺寸：缩略图(200px)、列表图(400px)、原图
    // 3. 建议在云存储上传前用 tinypng/imagemin 预处理压缩
    // 4. 云存储开启 CDN 加速，设置合理的 Cache-Control 头
  },

  // 云开发环境ID
  cloudEnv: 'cloud1-d6gmlx4ss77f8e361'
}
