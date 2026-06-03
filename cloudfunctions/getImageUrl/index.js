const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { action, fileList } = event

  try {
    if (action === 'getTempFileURL') {
      return await getTempFileURL(fileList)
    } else if (action === 'getSingleURL') {
      return await getSingleURL(fileList[0])
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function getTempFileURL(fileList) {
  if (!fileList || fileList.length === 0) {
    return { success: true, fileList: [] }
  }

  const validFileIds = fileList.filter(id => id && id.startsWith('cloud://'))
  if (validFileIds.length === 0) {
    return { success: true, fileList: [] }
  }

  // 分批处理，每次最多50个
  const BATCH_SIZE = 50
  const urlMap = {}
  const allFileList = []

  for (let i = 0; i < validFileIds.length; i += BATCH_SIZE) {
    const batch = validFileIds.slice(i, i + BATCH_SIZE)
    try {
      const result = await cloud.getTempFileURL({
        fileList: batch
      })
      for (const item of result.fileList || []) {
        allFileList.push(item)
        if (item.status === 0) {
          urlMap[item.fileID] = item.tempFileURL
        }
      }
    } catch (err) {
      console.error('批次获取临时URL失败:', err)
    }
  }

  return {
    success: true,
    fileList: allFileList,
    urlMap: urlMap
  }
}

async function getSingleURL(fileId) {
  if (!fileId || !fileId.startsWith('cloud://')) {
    return { success: false, message: '无效的文件ID' }
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileId]
    })

    if (result.fileList && result.fileList[0] && result.fileList[0].status === 0) {
      return {
        success: true,
        tempFileURL: result.fileList[0].tempFileURL
      }
    } else {
      return {
        success: false,
        message: result.fileList[0].errorMessage || '获取失败'
      }
    }
  } catch (err) {
    console.error('获取临时URL失败:', err)
    return { success: false, message: err.message }
  }
}