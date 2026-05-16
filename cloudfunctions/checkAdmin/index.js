const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const openId = event.openId

  try {
    const result = await db.collection('admins').doc(openId).get()
    console.log('管理员查询结果:', result)
    
    if (result.data && result.data.role === 'admin') {
      return {
        isAdmin: true
      }
    } else {
      return {
        isAdmin: false
      }
    }
  } catch (err) {
    console.error('检查管理员失败:', err)
    return {
      isAdmin: false
    }
  }
}