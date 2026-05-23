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
      return res.result.urlMap || {}
    })
  } else {
    // 直接获取（生产环境）
    return wx.cloud.getTempFileURL({
      fileList: fileIds
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(file => {
        if (file.status === 0) {
          urlMap[file.fileID] = file.tempFileURL
        }
      })
      return urlMap
    })
  }
}

/**
 * 转换数据中的云存储FileID为临时URL
 * @param {Array} data - 数据数组
 * @param {String} fieldName - 包含FileID的字段名
 * @returns {Promise} 转换后的数据数组
 */
function convertCloudStorageUrls(data, fieldName) {
  const fileIds = data
    .filter(item => item[fieldName] && item[fieldName].startsWith('cloud://'))
    .map(item => item[fieldName])

  if (fileIds.length === 0) {
    return Promise.resolve(data)
  }

  return getTempFileURL(fileIds).then(urlMap => {
    return data.map(item => {
      if (item[fieldName] && item[fieldName].startsWith('cloud://')) {
        return {
          ...item,
          [fieldName]: urlMap[item[fieldName]] || item[fieldName]
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
