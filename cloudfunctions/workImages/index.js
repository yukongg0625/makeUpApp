const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, workId, imageId, data } = event

  try {
    switch (action) {
      case 'add':
        return await addImage(workId, data)

      case 'update':
        return await updateImage(imageId, data)

      case 'delete':
        return await deleteImage(imageId)

      case 'getByWork':
        return await getImagesByWork(workId)

      case 'setCover':
        return await setCoverImage(workId, imageId)

      case 'batchDelete':
        return await batchDeleteImages(event.imageIds)

      case 'getAllImages':
        return await getAllImages()

      default:
        return { success: false, message: '未知操作' }
    }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function addImage(workId, data) {
  const result = await db.collection('workImages').add({
    data: {
      workId: workId,
      url: data.url || '',
      title: data.title || '',
      usageType: data.usageType || '',
      description: data.description || '',
      order: data.order || 0,
      createdAt: db.serverDate()
    }
  })

  return {
    success: true,
    data: { _id: result._id }
  }
}

async function updateImage(imageId, data) {
  const updateData = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.usageType !== undefined) updateData.usageType = data.usageType
  if (data.description !== undefined) updateData.description = data.description
  if (data.order !== undefined) updateData.order = data.order
  if (data.url !== undefined) updateData.url = data.url

  await db.collection('workImages').doc(imageId).update({
    data: updateData
  })

  return { success: true }
}

async function deleteImage(imageId) {
  await db.collection('workImages').doc(imageId).remove()
  return { success: true }
}

async function getImagesByWork(workId) {
  const result = await db.collection('workImages')
    .where({ workId: workId })
    .orderBy('order', 'asc')
    .get()

  return {
    success: true,
    data: result.data
  }
}

async function setCoverImage(workId, imageId) {
  await db.collection('works').doc(workId).update({
    data: {
      coverImageId: imageId
    }
  })
  return { success: true }
}

async function batchDeleteImages(imageIds) {
  const promises = imageIds.map(id =>
    db.collection('workImages').doc(id).remove()
  )
  await Promise.all(promises)
  return { success: true }
}

async function getAllImages() {
  // 获取所有图片
  let result = { data: [] }
  try {
    result = await db.collection('workImages')
      .orderBy('createdAt', 'desc')
      .get()
  } catch (err) {
    console.log('workImages集合查询失败，返回空列表:', err.message)
    return {
      success: true,
      data: []
    }
  }

  // 获取作品信息
  let worksMap = {}
  try {
    const worksResult = await db.collection('works').field({ _id: true, coverImageId: true, title: true }).get()
    for (const work of worksResult.data || []) {
      worksMap[work._id] = work
    }
  } catch (err) {
    console.log('works集合查询失败，跳过:', err.message)
  }

  // 获取精华信息
  let featuredMap = {}
  try {
    const featuredResult = await db.collection('featured').field({ _id: true, workId: true, title: true }).get()
    for (const item of featuredResult.data || []) {
      featuredMap[item.workId] = item
    }
  } catch (err) {
    console.log('featured集合查询失败，跳过:', err.message)
  }

  const imagesWithTempUrl = []

  for (const image of result.data || []) {
    const tempUrl = await getTempUrl(image.url)
    const work = worksMap[image.workId]
    const isCover = work && work.coverImageId === image._id
    const isFeatured = featuredMap[image.workId] != null

    let createdDate = ''
    if (image.createdAt) {
      const date = new Date(image.createdAt)
      createdDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    imagesWithTempUrl.push({
      _id: image._id,
      url: image.url,
      tempUrl: tempUrl,
      title: image.title || '',
      workId: image.workId,
      workTitle: work ? work.title : '未知作品',
      isCover: isCover,
      isFeatured: isFeatured,
      createdDate: createdDate
    })
  }

  return {
    success: true,
    data: imagesWithTempUrl
  }
}

async function getTempUrl(fileId) {
  if (!fileId || !fileId.startsWith('cloud://')) {
    return fileId
  }
  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileId]
    })
    if (result.fileList && result.fileList[0] && result.fileList[0].status === 0) {
      return result.fileList[0].tempFileURL
    }
  } catch (err) {
    console.error('获取临时链接失败:', err)
  }
  return fileId
}