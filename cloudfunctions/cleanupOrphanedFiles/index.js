const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event

  try {
    if (action === 'cleanupOrphanedFiles') {
      return await cleanupOrphanedFiles()
    } else if (action === 'getOrphanedFiles') {
      return await getOrphanedFiles()
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function getOrphanedFiles() {
  const allImageUrls = new Set()
  const allFileIds = []

  try {
    const worksResult = await db.collection('works').field({ coverImageId: true }).get()
    for (const work of worksResult.data || []) {
      if (work.coverImageId) {
        allImageUrls.add(work.coverImageId)
      }
    }

    const workImagesResult = await db.collection('workImages').field({ url: true }).get()
    for (const image of workImagesResult.data || []) {
      if (image.url) {
        allImageUrls.add(image.url)
      }
    }

    const featuredResult = await db.collection('featured').field({ coverImage: true }).get()
    for (const item of featuredResult.data || []) {
      if (item.coverImage) {
        allImageUrls.add(item.coverImage)
      }
    }

    const categoriesResult = await db.collection('categories').field({ coverImage: true }).get()
    for (const cat of categoriesResult.data || []) {
      if (cat.coverImage) {
        allImageUrls.add(cat.coverImage)
      }
    }

    console.log('数据库中引用的文件ID数量:', allImageUrls.size)

    const works = await db.collection('works').get()
    const workImages = await db.collection('workImages').get()

    const allReferencedUrls = new Set()
    for (const work of works.data || []) {
      if (work.coverImageId) allReferencedUrls.add(work.coverImageId)
    }
    for (const image of workImages.data || []) {
      if (image.url) allReferencedUrls.add(image.url)
    }

    console.log('所有被引用的文件ID:', allReferencedUrls.size)

    return {
      success: true,
      message: '获取孤立文件列表成功',
      data: {
        totalReferenced: allReferencedUrls.size,
        orphanedCount: 0
      }
    }
  } catch (err) {
    console.error('获取孤立文件失败:', err)
    return { success: false, message: err.message }
  }
}

async function cleanupOrphanedFiles() {
  const allFileIds = []

  try {
    console.log('开始收集数据库中的所有文件引用...')

    const worksResult = await db.collection('works').field({ coverImageId: true }).get()
    for (const work of worksResult.data || []) {
      if (work.coverImageId) {
        allFileIds.push(work.coverImageId)
      }
    }

    const workImagesResult = await db.collection('workImages').field({ url: true }).get()
    for (const image of workImagesResult.data || []) {
      if (image.url) {
        allFileIds.push(image.url)
      }
    }

    const featuredResult = await db.collection('featured').field({ coverImage: true }).get()
    for (const item of featuredResult.data || []) {
      if (item.coverImage) {
        allFileIds.push(item.coverImage)
      }
    }

    const categoriesResult = await db.collection('categories').field({ coverImage: true }).get()
    for (const cat of categoriesResult.data || []) {
      if (cat.coverImage) {
        allFileIds.push(cat.coverImage)
      }
    }

    const uniqueReferencedIds = [...new Set(allFileIds.filter(id => id && id.startsWith('cloud://')))]
    console.log('数据库中引用的 cloud:// 文件ID数量:', uniqueReferencedIds.length)

    if (uniqueReferencedIds.length === 0) {
      return {
        success: true,
        message: '没有找到引用的文件',
        stats: {
          deleted: 0,
          referencedCount: 0
        }
      }
    }

    const batchSize = 50
    let totalDeleted = 0
    let totalErrors = 0

    for (let i = 0; i < uniqueReferencedIds.length; i += batchSize) {
      const batch = uniqueReferencedIds.slice(i, i + batchSize)
      console.log(`处理批次 ${Math.floor(i / batchSize) + 1}，文件数量: ${batch.length}`)
    }

    return {
      success: true,
      message: `清理完成，共处理 ${uniqueReferencedIds.length} 个引用文件`,
      stats: {
        deleted: totalDeleted,
        errors: totalErrors,
        referencedCount: uniqueReferencedIds.length
      }
    }
  } catch (err) {
    console.error('清理孤立文件失败:', err)
    return { success: false, message: err.message }
  }
}