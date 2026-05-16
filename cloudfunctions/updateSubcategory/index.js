// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id, categoryId, categoryName, name, order, hidden } = event

  try {
    console.log('=== 更新子类云函数 ===')
    console.log('id:', id)
    console.log('categoryId:', categoryId)
    console.log('categoryName:', categoryName)
    console.log('name:', name)
    console.log('order:', order)
    console.log('hidden:', hidden)

    const oldSubcategory = await db.collection('subcategories').doc(id).get()
    const oldName = oldSubcategory.data ? oldSubcategory.data.name : ''

    console.log('旧名称:', oldName)

    const hiddenBool = hidden === true || hidden === 'true'

    console.log('hidden (原始):', hidden, '类型:', typeof hidden)
    console.log('hidden (转换后):', hiddenBool)

    const updateData = {
      categoryId: categoryId,
      categoryName: categoryName,
      name: name,
      order: order,
      hidden: hiddenBool
    }

    const updateResult = await db.collection('subcategories').doc(id).update({
      data: updateData
    })

    console.log('subcategories 更新结果:', updateResult)

    const verifyResult = await db.collection('subcategories').doc(id).get()
    console.log('验证结果:', verifyResult.data ? verifyResult.data.name : '未找到')

    if (oldName && oldName !== name) {
      console.log('名称已变更，更新 works 表...')
      const worksUpdateResult = await db.collection('works').where({
        subcategoryId: id
      }).update({
        data: {
          subcategoryName: name
        }
      })
      console.log('works 更新结果:', worksUpdateResult)
    }

    return {
      success: true,
      message: '更新成功',
      data: {
        oldName: oldName,
        newName: name
      }
    }
  } catch (err) {
    console.error('更新失败:', err)
    return {
      success: false,
      message: '更新失败：' + err.message
    }
  }
}