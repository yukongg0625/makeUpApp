const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, categoryId, subcategoryId, workId } = event

  try {
    if (action === 'deleteCategory') {
      return await deleteCategoryWithChildren(categoryId)
    } else if (action === 'deleteSubcategory') {
      return await deleteSubcategoryWithChildren(subcategoryId)
    } else if (action === 'deleteWork') {
      return await deleteWorkWithChildren(workId)
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function cleanupFeatured(workIds) {
  let removedFromFeatured = 0
  const errors = []

  if (!workIds || workIds.length === 0) {
    return { removedFromFeatured, errors }
  }

  try {
    const featuredResult = await db.collection('featured')
      .where({
        workId: _.in(workIds)
      })
      .get()

    for (const item of featuredResult.data || []) {
      try {
        await db.collection('featured').doc(item._id).remove()
        removedFromFeatured++
      } catch (err) {
        // 忽略所有错误，继续删除其他记录
        console.log(`从featured移除 ${item._id} 跳过:`, err.message)
      }
    }
  } catch (err) {
    // 集合不存在或其他错误，直接跳过
    console.log('featured集合清理跳过:', err.message)
  }

  return { removedFromFeatured, errors }
}

async function deleteCloudFiles(fileIds) {
  if (!fileIds || fileIds.length === 0) {
    return { deleted: 0, errors: [] }
  }

  const validFileIds = fileIds.filter(id => id && id.startsWith('cloud://'))
  if (validFileIds.length === 0) {
    return { deleted: 0, errors: [] }
  }

  try {
    const deleteResult = await cloud.deleteFile({
      fileList: validFileIds
    })

    let deleted = 0
    const errors = []

    for (const result of deleteResult.fileList || []) {
      if (result.status === 0) {
        deleted++
      } else {
        errors.push({ fileId: result.fileID, error: result.errorMessage })
      }
    }

    return { deleted, errors }
  } catch (err) {
    console.error('删除云存储文件失败:', err)
    return { deleted: 0, errors: [{ error: err.message }] }
  }
}

async function deleteCategoryWithChildren(categoryId) {
  let deletedCategories = 0
  let deletedSubcategories = 0
  let deletedWorks = 0
  let deletedImages = 0
  let removedFromFeatured = 0
  let deletedFiles = 0
  const allFileIds = []

  try {
    // 获取所有子类
    let subcategories = []
    try {
      const subcategoriesResult = await db.collection('subcategories')
        .where({ categoryId: categoryId })
        .get()
      subcategories = subcategoriesResult.data || []
    } catch (err) {
      console.log('subcategories集合不存在或查询失败，跳过:', err.message)
    }

    const allWorkIds = []

    for (const subcategory of subcategories) {
      try {
        // 获取子类下的所有作品
        let works = []
        try {
          const worksResult = await db.collection('works')
            .where({ subcategoryId: subcategory._id })
            .get()
          works = worksResult.data || []
        } catch (err) {
          console.log('works集合查询失败，跳过:', err.message)
        }

        for (const work of works) {
          allWorkIds.push(work._id)
        }

        for (const work of works) {
          try {
            // 删除封面图片记录
            if (work.coverImageId) {
              try {
                const coverResult = await db.collection('workImages').doc(work.coverImageId).get()
                if (coverResult.data && coverResult.data.url) {
                  allFileIds.push(coverResult.data.url)
                }
                await db.collection('workImages').doc(work.coverImageId).remove()
                deletedImages++
              } catch (err) {
                console.log(`删除封面图片记录 ${work.coverImageId} 跳过:`, err.message)
              }
            }

            // 删除作品图片记录
            try {
              const imagesResult = await db.collection('workImages')
                .where({ workId: work._id })
                .get()

              for (const image of imagesResult.data || []) {
                if (image.url) {
                  allFileIds.push(image.url)
                }
                await db.collection('workImages').doc(image._id).remove()
                deletedImages++
              }
            } catch (err) {
              console.log(`删除作品图片记录跳过:`, err.message)
            }

            // 删除作品
            await db.collection('works').doc(work._id).remove()
            deletedWorks++
          } catch (err) {
            console.log(`删除作品 ${work._id} 跳过:`, err.message)
          }
        }

        // 删除子类
        await db.collection('subcategories').doc(subcategory._id).remove()
        deletedSubcategories++
      } catch (err) {
        console.log(`删除子类 ${subcategory._id} 跳过:`, err.message)
      }
    }

    // 清理精选
    if (allWorkIds.length > 0) {
      const featuredCleanup = await cleanupFeatured(allWorkIds)
      removedFromFeatured = featuredCleanup.removedFromFeatured
    }

    // 删除云存储文件
    const fileDeleteResult = await deleteCloudFiles(allFileIds)
    deletedFiles = fileDeleteResult.deleted

    // 删除影集
    try {
      await db.collection('categories').doc(categoryId).remove()
      deletedCategories++
    } catch (err) {
      console.log(`删除影集 ${categoryId} 跳过:`, err.message)
    }

    return {
      success: true,
      message: `删除完成：影集${deletedCategories}个，子类${deletedSubcategories}个，作品${deletedWorks}个，图片${deletedImages}个，文件${deletedFiles}个，精选移除${removedFromFeatured}个`,
      stats: {
        categories: deletedCategories,
        subcategories: deletedSubcategories,
        works: deletedWorks,
        images: deletedImages,
        deletedFiles,
        removedFromFeatured
      }
    }
  } catch (err) {
    console.error('删除失败:', err)
    return { success: false, message: err.message }
  }
}

async function deleteSubcategoryWithChildren(subcategoryId) {
  let deletedSubcategories = 0
  let deletedWorks = 0
  let deletedImages = 0
  let removedFromFeatured = 0
  let deletedFiles = 0
  const allFileIds = []

  try {
    // 获取子类下的所有作品
    let works = []
    try {
      const worksResult = await db.collection('works')
        .where({ subcategoryId: subcategoryId })
        .get()
      works = worksResult.data || []
    } catch (err) {
      console.log('works集合查询失败，跳过:', err.message)
    }

    const allWorkIds = works.map(w => w._id)

    for (const work of works) {
      try {
        // 删除封面图片记录
        if (work.coverImageId) {
          try {
            const coverResult = await db.collection('workImages').doc(work.coverImageId).get()
            if (coverResult.data && coverResult.data.url) {
              allFileIds.push(coverResult.data.url)
            }
            await db.collection('workImages').doc(work.coverImageId).remove()
            deletedImages++
          } catch (err) {
            console.log(`删除封面图片记录 ${work.coverImageId} 跳过:`, err.message)
          }
        }

        // 删除作品图片记录
        try {
          const imagesResult = await db.collection('workImages')
            .where({ workId: work._id })
            .get()

          for (const image of imagesResult.data || []) {
            if (image.url) {
              allFileIds.push(image.url)
            }
            await db.collection('workImages').doc(image._id).remove()
            deletedImages++
          }
        } catch (err) {
          console.log(`删除作品图片记录跳过:`, err.message)
        }

        // 删除作品
        await db.collection('works').doc(work._id).remove()
        deletedWorks++
      } catch (err) {
        console.log(`删除作品 ${work._id} 跳过:`, err.message)
      }
    }

    // 清理精选
    if (allWorkIds.length > 0) {
      const featuredCleanup = await cleanupFeatured(allWorkIds)
      removedFromFeatured = featuredCleanup.removedFromFeatured
    }

    // 删除云存储文件
    const fileDeleteResult = await deleteCloudFiles(allFileIds)
    deletedFiles = fileDeleteResult.deleted

    // 删除子类
    try {
      await db.collection('subcategories').doc(subcategoryId).remove()
      deletedSubcategories++
    } catch (err) {
      console.log(`删除子类 ${subcategoryId} 跳过:`, err.message)
    }

    return {
      success: true,
      message: `删除完成：子类${deletedSubcategories}个，作品${deletedWorks}个，图片${deletedImages}个，文件${deletedFiles}个，精选移除${removedFromFeatured}个`,
      stats: {
        subcategories: deletedSubcategories,
        works: deletedWorks,
        images: deletedImages,
        deletedFiles,
        removedFromFeatured
      }
    }
  } catch (err) {
    console.error('删除失败:', err)
    return { success: false, message: err.message }
  }
}

async function deleteWorkWithChildren(workId) {
  let deletedWorks = 0
  let deletedFiles = 0
  let removedFromFeatured = 0
  const allFileIds = []

  try {
    // 获取作品信息
    let work = null
    try {
      const workResult = await db.collection('works').doc(workId).get()
      work = workResult.data
    } catch (err) {
      console.log(`作品 ${workId} 不存在，跳过:`, err.message)
    }

    if (work) {
      // 收集封面图片 fileID
      if (work.coverImage) {
        allFileIds.push(work.coverImage)
      }

      // 收集作品图片列表 fileIDs
      if (work.images && Array.isArray(work.images)) {
        work.images.forEach(imgId => {
          if (imgId) allFileIds.push(imgId)
        })
      }

      // 删除作品
      try {
        await db.collection('works').doc(workId).remove()
        deletedWorks++
      } catch (err) {
        console.log(`删除作品 ${workId} 跳过:`, err.message)
      }
    }

    // 清理精选
    try {
      const featuredCleanup = await cleanupFeatured([workId])
      removedFromFeatured = featuredCleanup.removedFromFeatured
    } catch (err) {
      console.log(`清理精选跳过:`, err.message)
    }

    // 删除云存储文件
    const fileDeleteResult = await deleteCloudFiles(allFileIds)
    deletedFiles = fileDeleteResult.deleted

    return {
      success: true,
      message: `删除完成：作品${deletedWorks}个，文件${deletedFiles}个，精选移除${removedFromFeatured}个`,
      stats: {
        works: deletedWorks,
        deletedFiles,
        removedFromFeatured
      }
    }
  } catch (err) {
    console.error('删除失败:', err)
    return { success: false, message: err.message }
  }
}