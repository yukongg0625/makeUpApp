// 云存储工具函数
const config = require('../config.js')

/**
 * 获取云存储文件临时URL
 * @param {Array} fileIds - 云存储文件ID数组
 * @returns {Promise} 返回 { urlMap: { fileID: tempFileURL } }
 */
function getTempFileURL(fileIds) {
  if (!fileIds || fileIds.length === 0) {
    return Promise.resolve({})
  }

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
  convertCloudStorageUrls
}
