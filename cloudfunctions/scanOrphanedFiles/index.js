const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, fileIds } = event

  try {
    if (action === 'checkCategoryImages') {
      return await checkCategoryImages()
    } else if (action === 'deleteCategoryImages') {
      return await deleteCategoryImages(fileIds)
    } else if (action === 'checkWorksImages') {
      return await checkWorksImages()
    } else if (action === 'checkAllImages') {
      return await checkAllImages()
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function checkCategoryImages() {
  console.log('开始检查分类图片...')

  let categories = []
  try {
    const categoriesResult = await db.collection('categories').get()
    categories = categoriesResult.data || []
  } catch (err) {
    console.log('categories 集合访问失败:', err.message)
    return { success: false, message: '无法访问 categories 集合' }
  }

  const referencedImages = []
  categories.forEach(c => {
    if (c.coverImage) {
      referencedImages.push({
        categoryId: c._id,
        categoryName: c.name,
        coverImage: c.coverImage
      })
    }
  })

  return {
    success: true,
    type: 'categories',
    referencedImages: referencedImages,
    stats: {
      totalCategories: categories.length,
      referencedImages: referencedImages.length
    }
  }
}

async function checkWorksImages() {
  console.log('开始检查作品图片...')

  let works = []
  try {
    const worksResult = await db.collection('works').get()
    works = worksResult.data || []
  } catch (err) {
    console.log('works 集合访问失败:', err.message)
    return { success: false, message: '无法访问 works 集合' }
  }

  const referencedImages = []
  works.forEach(w => {
    if (w.coverImage) {
      referencedImages.push({
        workId: w._id,
        workTitle: w.title,
        imageType: 'cover',
        fileId: w.coverImage
      })
    }
    if (w.images && Array.isArray(w.images)) {
      w.images.forEach((imgId, index) => {
        referencedImages.push({
          workId: w._id,
          workTitle: w.title,
          imageType: 'gallery',
          imageIndex: index,
          fileId: imgId
        })
      })
    }
  })

  return {
    success: true,
    type: 'works',
    referencedImages: referencedImages,
    stats: {
      totalWorks: works.length,
      referencedImages: referencedImages.length
    }
  }
}

async function checkAllImages() {
  console.log('开始检查所有图片...')

  // 获取分类图片
  let categories = []
  try {
    const categoriesResult = await db.collection('categories').get()
    categories = categoriesResult.data || []
  } catch (err) {
    console.log('categories 集合访问失败:', err.message)
  }

  // 获取作品图片
  let works = []
  try {
    const worksResult = await db.collection('works').get()
    works = worksResult.data || []
  } catch (err) {
    console.log('works 集合访问失败:', err.message)
  }

  // 获取客照
  let customerPhotos = []
  try {
    const customerPhotosResult = await db.collection('customerPhotos').get()
    customerPhotos = customerPhotosResult.data || []
  } catch (err) {
    console.log('customerPhotos 集合访问失败:', err.message)
  }

  // 汇总所有被引用的图片
  const allReferenced = []
  const referencedFileIds = new Set()

  // 分类封面
  categories.forEach(c => {
    if (c.coverImage) {
      allReferenced.push({
        type: 'category',
        name: c.name,
        fileId: c.coverImage
      })
      referencedFileIds.add(c.coverImage)
    }
  })

  // 作品封面和图集
  works.forEach(w => {
    if (w.coverImage) {
      allReferenced.push({
        type: 'work_cover',
        name: w.title,
        fileId: w.coverImage
      })
      referencedFileIds.add(w.coverImage)
    }
    if (w.images && Array.isArray(w.images)) {
      w.images.forEach(imgId => {
        allReferenced.push({
          type: 'work_gallery',
          name: w.title,
          fileId: imgId
        })
        referencedFileIds.add(imgId)
      })
    }
  })

  // 客照
  customerPhotos.forEach(p => {
    if (p.url) {
      allReferenced.push({
        type: 'customer_photo',
        name: p.title || '客照',
        fileId: p.url
      })
      referencedFileIds.add(p.url)
    }
  })

  return {
    success: true,
    allReferenced: allReferenced,
    referencedFileIds: Array.from(referencedFileIds),
    stats: {
      totalCategories: categories.length,
      totalWorks: works.length,
      totalCustomerPhotos: customerPhotos.length,
      totalReferencedImages: referencedFileIds.size
    }
  }
}

async function deleteCategoryImages(fileIds) {
  if (!fileIds || fileIds.length === 0) {
    return { success: true, deleted: 0, message: '没有文件需要删除' }
  }

  let deletedFiles = 0
  const errors = []

  try {
    const deleteResult = await cloud.deleteFile({
      fileList: fileIds
    })

    for (const result of deleteResult.fileList || []) {
      if (result.status === 0) {
        deletedFiles++
      } else {
        errors.push({
          fileId: result.fileID,
          error: result.errorMessage
        })
      }
    }
  } catch (err) {
    console.error('删除云存储文件失败:', err)
    errors.push({ error: err.message })
  }

  return {
    success: true,
    deletedFiles: deletedFiles,
    errors: errors,
    message: `成功删除 ${deletedFiles} 个文件`
  }
}
