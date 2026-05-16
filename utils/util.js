/**
 * 工具函数库
 */

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或时间戳
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm'
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间
 * @param {Date|string} date - 日期对象或时间戳
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const d = new Date(date)
  const diff = now - d
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 压缩图片
 * @param {string} src - 图片路径
 * @param {number} quality - 压缩质量，默认 0.8
 */
export function compressImage(src, quality = 0.8) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 上传图片到云存储
 * @param {string} filePath - 本地文件路径
 * @param {string} cloudPath - 云存储路径
 */
export function uploadFile(filePath, cloudPath) {
  return wx.cloud.uploadFile({
    cloudPath,
    filePath,
    config: {
      header: {
        'x-cos-acl': 'public-read'
      }
    }
  })
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
export function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示提示消息
 * @param {string} title - 提示文字
 * @param {string} icon - 图标类型
 */
export function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

/**
 * 验证手机号
 * @param {string} phone - 手机号
 */
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 获取图片临时URL（通过云函数，绕过权限限制）
 * @param {string|Array} fileIds - 文件ID或文件ID数组
 */
export function getImageTempUrl(fileIds) {
  return new Promise((resolve, reject) => {
    if (!fileIds) {
      reject(new Error('文件ID不能为空'))
      return
    }

    const fileList = Array.isArray(fileIds) ? fileIds : [fileIds]

    wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getTempFileURL',
        fileList: fileList
      },
      success: res => {
        if (res.result && res.result.success) {
          resolve(res.result)
        } else {
          reject(new Error(res.result.message || '获取图片URL失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取单张图片临时URL
 * @param {string} fileId - 文件ID
 */
export function getSingleImageUrl(fileId) {
  return new Promise((resolve, reject) => {
    if (!fileId) {
      reject(new Error('文件ID不能为空'))
      return
    }

    wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getSingleURL',
        fileList: [fileId]
      },
      success: res => {
        if (res.result && res.result.success) {
          resolve(res.result.tempFileURL)
        } else {
          reject(new Error(res.result.message || '获取图片URL失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取系统信息
 */
export function getSystemInfo() {
  return wx.getSystemInfoSync()
}

/**
 * 检查是否为 iPhone X 及以上机型
 */
export function isIPhoneX() {
  const { model, platform } = getSystemInfo()
  return platform === 'ios' && model.includes('iPhone') && parseFloat(model.replace('iPhone', '')) >= 8
}
