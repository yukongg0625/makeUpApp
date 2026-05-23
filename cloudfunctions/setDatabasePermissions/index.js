// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 重要说明：微信云开发目前不支持通过代码直接修改集合权限
    // 此函数提供权限检查和设置指导
    
    const collections = ['categories', 'subcategories', 'works', 'banners', 'featured', 'customerPhotos', 'settings']
    const results = []
    
    // 检查每个集合的访问权限
    for (const collectionName of collections) {
      try {
        // 尝试读取数据来验证权限
        const res = await db.collection(collectionName).limit(1).get()
        results.push({
          collection: collectionName,
          readStatus: '可访问',
          count: res.data.length
        })
      } catch (err) {
        results.push({
          collection: collectionName,
          readStatus: '访问失败',
          error: err.message
        })
      }
    }
    
    return {
      success: true,
      message: '权限检查完成',
      results: results,
      instructions: [
        '微信云开发不支持通过代码设置集合权限',
        '请在云开发控制台手动设置：',
        '1. 打开云开发控制台 → 数据库',
        '2. 点击集合名称',
        '3. 点击"数据权限"标签',
        '4. 选择"所有用户可读，仅创建者可读写"',
        '5. 点击"保存"按钮',
        '6. 对所有集合重复此操作'
      ],
      note: '设置权限后，请重新编译小程序以验证效果'
    }
  } catch (err) {
    console.error('权限检查失败:', err)
    return {
      success: false,
      message: '权限检查失败：' + err.message
    }
  }
}
