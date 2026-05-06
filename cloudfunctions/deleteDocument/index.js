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
    await db.collection(collection).doc(id).remove()
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
