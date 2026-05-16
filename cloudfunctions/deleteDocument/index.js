// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { collection, id } = event
  
  try {
    // 先获取文档数据，用于删除关联的存储文件
    const doc = await db.collection(collection).doc(id).get()
    const docData = doc.data
    
    // 删除数据库记录
    await db.collection(collection).doc(id).remove()
    
    // 如果是作品集合，删除关联的云存储图片
    if (collection === 'works' && docData) {
      const fileIdsToDelete = []
      
      // 收集封面图片
      if (docData.coverImage) {
        fileIdsToDelete.push(docData.coverImage)
      }
      
      // 收集所有图片
      if (docData.images && Array.isArray(docData.images)) {
        fileIdsToDelete.push(...docData.images)
      }
      
      // 去重
      const uniqueFileIds = [...new Set(fileIdsToDelete)]
      
      if (uniqueFileIds.length > 0) {
        // 删除云存储文件
        await cloud.deleteFile({
          fileList: uniqueFileIds
        })
        console.log('已删除云存储文件:', uniqueFileIds)
      }
    }
    
    return {
      success: true,
      message: '删除成功'
    }
  } catch (err) {
    console.error('删除失败:', err)
    return {
      success: false,
      message: '删除失败：' + err.message
    }
  }
}
