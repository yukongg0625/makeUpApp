const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, fileIds, imageIds } = event

  try {
    if (action === 'deleteFiles') {
      return await deleteFiles(fileIds)
    } else if (action === 'deleteImageRecord') {
      return await deleteImageRecord(imageIds)
    } else if (action === 'deleteFilesAndRecords') {
      return await deleteFilesAndRecords(fileIds, imageIds)
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('云函数错误:', err)
    return { success: false, message: err.message }
  }
}

async function deleteFiles(fileIds) {
  if (!fileIds || fileIds.length === 0) {
    return { success: true, deleted: 0 }
  }

  const validFileIds = fileIds.filter(id => id && id.startsWith('cloud://'))
  if (validFileIds.length === 0) {
    return { success: true, deleted: 0 }
  }

  const result = await cloud.deleteFile({
    fileList: validFileIds
  })

  let deleted = 0
  const errors = []

  for (const item of result.fileList || []) {
    if (item.status === 0) {
      deleted++
    } else {
      errors.push({ fileId: item.fileID, error: item.errorMessage })
    }
  }

  return { success: true, deleted, errors }
}

async function deleteImageRecord(imageIds) {
  if (!imageIds || imageIds.length === 0) {
    return { success: true, deleted: 0 }
  }

  let deleted = 0
  const errors = []

  for (const id of imageIds) {
    try {
      await db.collection('workImages').doc(id).remove()
      deleted++
    } catch (err) {
      errors.push({ id, error: err.message })
    }
  }

  return { success: true, deleted, errors }
}

async function deleteFilesAndRecords(fileIds, imageIds) {
  const fileResult = await deleteFiles(fileIds)
  const recordResult = await deleteImageRecord(imageIds)

  return {
    success: true,
    deletedFiles: fileResult.deleted,
    deletedRecords: recordResult.deleted,
    errors: [...fileResult.errors, ...recordResult.errors]
  }
}