const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { fileIds } = event
  
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return { success: false, message: 'fileIds 不能为空' }
  }
  
  try {
    const result = await cloud.downloadFile({
      fileList: fileIds.map(fileId => ({
        fileID: fileId,
        maxAge: 365 * 24 * 60 * 60
      }))
    })
    
    return { 
      success: true, 
      fileList: result.fileList 
    }
  } catch (err) {
    console.error('设置文件权限失败:', err)
    return { success: false, message: err.message }
  }
}
