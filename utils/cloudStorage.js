// 云存储工具函数
const config = require('../config.js')

// 缓存配置：临时URL默认缓存50分钟（云存储临时URL通常1小时过期）
const CACHE_KEY = 'cloud_img_url_cache'
const CACHE_TTL = 50 * 60 * 1000 // 50分钟

/**
 * 从缓存获取URL
 */
function getCachedUrl(fileId) {
  try {
    const cache = wx.getStorageSync(CACHE_KEY) || {}
    const entry = cache[fileId]
    if (entry && entry.url && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.url
    }
    // 过期则清除
    if (entry) {
      delete cache[fileId]
      wx.setStorageSync(CACHE_KEY, cache)
    }
  } catch (e) {
    console.warn('读取图片URL缓存失败:', e)
  }
  return null
}

/**
 * 缓存URL
 */
function setCachedUrl(fileId, url) {
  try {
    const cache = wx.getStorageSync(CACHE_KEY) || {}
    cache[fileId] = { url, timestamp: Date.now() }
    wx.setStorageSync(CACHE_KEY, cache)
  } catch (e) {
    console.warn('写入图片URL缓存失败:', e)
  }
}

/**
 * 批量获取缓存URL，返回 { cached: { fileId: url }, missing: [fileId] }
 */
function batchGetCachedUrls(fileIds) {
  const cached = {}
  const missing = []
  fileIds.forEach(id => {
    const url = getCachedUrl(id)
    if (url) {
      cached[id] = url
    } else {
      missing.push(id)
    }
  })
  return { cached, missing }
}

/**
 * 获取云存储文件临时URL（带缓存）
 * @param {Array} fileIds - 云存储文件ID数组
 * @returns {Promise} 返回 { urlMap: { fileID: tempFileURL } }
 */
function getTempFileURL(fileIds) {
  if (!fileIds || fileIds.length === 0) {
    return Promise.resolve({})
  }

  // 先检查缓存
  const { cached, missing } = batchGetCachedUrls(fileIds)
  console.log('图片URL缓存命中:', Object.keys(cached).length, '/', fileIds.length)

  if (missing.length === 0) {
    // 全部命中缓存
    return Promise.resolve(cached)
  }

  // 部分或全部未命中，请求缺失的
  const fetchPromise = missing.length > 0
    ? fetchTempFileURL(missing)
    : Promise.resolve({})

  return fetchPromise.then(newUrls => {
    // 缓存新获取的URL
    Object.keys(newUrls).forEach(id => setCachedUrl(id, newUrls[id]))
    // 合并缓存和新数据
    return { ...cached, ...newUrls }
  })
}

/**
 * 实际请求临时URL（内部函数）
 */
function fetchTempFileURL(fileIds) {
  if (config.storage.useCloudFunctionForImageUrl) {
    // 使用云函数获取（开发环境）
    return wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getTempFileURL',
        fileList: fileIds
      }
    }).then(res => {
      console.log('云函数获取图片URL成功:', res.result)
      if (res.result && res.result.success && res.result.urlMap) {
        return res.result.urlMap
      }
      console.warn('云函数返回格式异常，降级到前端获取')
      return fallbackGetTempFileURL(fileIds)
    }).catch(err => {
      console.warn('云函数获取图片URL失败，降级到前端获取:', err)
      return fallbackGetTempFileURL(fileIds)
    })
  } else {
    // 直接获取（生产环境）
    return fallbackGetTempFileURL(fileIds)
  }
}

/**
 * 降级方案：直接使用前端API获取临时URL
 */
function fallbackGetTempFileURL(fileIds) {
  return wx.cloud.getTempFileURL({
    fileList: fileIds
  }).then(res => {
    const urlMap = {}
    res.fileList.forEach(file => {
      if (file.status === 0) {
        urlMap[file.fileID] = file.tempFileURL
      } else {
        console.warn('文件获取临时URL失败:', file.fileID, file.status, file.errorMessage)
      }
    })
    return urlMap
  }).catch(err => {
    console.error('前端获取临时URL也失败:', err)
    return {}
  })
}

/**
 * 转换数据中的云存储FileID为临时URL
 * @param {Array} data - 数据数组
 * @param {String} fieldName - 包含FileID的字段名
 * @returns {Promise} 转换后的数据数组
 */
function convertCloudStorageUrls(data, fieldName) {
  if (!data || !Array.isArray(data)) {
    return Promise.resolve(data || [])
  }

  const fileIds = data
    .filter(item => item && item[fieldName] && typeof item[fieldName] === 'string' && item[fieldName].startsWith('cloud://'))
    .map(item => item[fieldName])

  console.log('convertCloudStorageUrls - 需要转换的文件:', fileIds)

  if (fileIds.length === 0) {
    console.log('convertCloudStorageUrls - 没有需要转换的文件')
    return Promise.resolve(data)
  }

  return getTempFileURL(fileIds).then(urlMap => {
    console.log('convertCloudStorageUrls - 转换结果:', urlMap)
    return data.map(item => {
      if (item && item[fieldName] && typeof item[fieldName] === 'string' && item[fieldName].startsWith('cloud://')) {
        const tempUrl = urlMap[item[fieldName]]
        if (tempUrl) {
          console.log('convertCloudStorageUrls - 替换成功:', item[fieldName], '->', tempUrl)
          return {
            ...item,
            [fieldName]: tempUrl
          }
        } else {
          console.warn('convertCloudStorageUrls - 文件不存在或获取失败，清空封面:', item[fieldName])
          return {
            ...item,
            [fieldName]: ''
          }
        }
      }
      return item
    })
  }).catch(err => {
    console.error('转换云存储 URL 失败:', err)
    return data
  })
}

module.exports = {
  getTempFileURL,
  convertCloudStorageUrls,
  clearUrlCache: function() {
    try {
      wx.removeStorageSync(CACHE_KEY)
      console.log('图片URL缓存已清除')
    } catch (e) {
      console.warn('清除缓存失败:', e)
    }
  }
}
