const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { action } = event

    if (action === 'migrate') {
      return await migrateOldWorks()
    } else if (action === 'rollback') {
      return await rollbackMigration()
    } else if (action === 'status') {
      return await getMigrationStatus()
    }

    return { success: false, message: '未知操作' }
  } catch (err) {
    console.error('迁移错误:', err)
    return { success: false, message: err.message }
  }
}

async function migrateOldWorks() {
  const worksResult = await db.collection('works').get()

  if (!worksResult.data || worksResult.data.length === 0) {
    return { success: true, message: '没有需要迁移的作品', migratedCount: 0 }
  }

  let migratedCount = 0
  const errors = []

  for (const work of worksResult.data) {
    try {
      const hasCoverImage = work.coverImage && work.coverImage.startsWith('cloud://')
      const hasImages = work.images && work.images.length > 0

      if (!hasCoverImage && !hasImages) {
        continue
      }

      const imageIds = []

      if (hasCoverImage) {
        const coverResult = await db.collection('workImages').add({
          data: {
            workId: work._id,
            url: work.coverImage,
            title: work.title || '',
            usageType: work.usageType || '',
            description: work.description || '',
            order: 0,
            isCover: true,
            createdAt: db.serverDate()
          }
        })
        imageIds.push(coverResult._id)

        await db.collection('works').doc(work._id).update({
          data: {
            coverImageId: coverResult._id,
            title: _.remove()
          }
        })
      }

      if (hasImages) {
        for (let i = 0; i < work.images.length; i++) {
          const imgUrl = work.images[i]
          if (imgUrl === work.coverImage) continue

          const imgResult = await db.collection('workImages').add({
            data: {
              workId: work._id,
              url: imgUrl,
              title: work.title || '',
              usageType: work.usageType || '',
              description: work.description || '',
              order: i + 1,
              isCover: false,
              createdAt: db.serverDate()
            }
          })
          imageIds.push(imgResult._id)
        }
      }

      await db.collection('works').doc(work._id).update({
        data: {
          coverImageId: imageIds[0] || '',
          migrated: true,
          migratedAt: db.serverDate()
        }
      })

      migratedCount++
    } catch (err) {
      console.error(`迁移作品 ${work._id} 失败:`, err)
      errors.push({ workId: work._id, error: err.message })
    }
  }

  return {
    success: true,
    message: `迁移完成，成功迁移 ${migratedCount} 个作品`,
    migratedCount: migratedCount,
    errors: errors
  }
}

async function rollbackMigration() {
  const worksResult = await db.collection('works')
    .where({ migrated: true })
    .get()

  let restoredCount = 0

  for (const work of worksResult.data) {
    try {
      await db.collection('workImages')
        .where({ workId: work._id })
        .remove()

      const updateData = {
        coverImage: work.coverImageId || '',
        images: [],
        migrated: _.remove(),
        migratedAt: _.remove()
      }

      if (work.title) {
        updateData.title = work.title
      }
      if (work.usageType) {
        updateData.usageType = work.usageType
      }
      if (work.description) {
        updateData.description = work.description
      }

      await db.collection('works').doc(work._id).update({
        data: updateData
      })

      restoredCount++
    } catch (err) {
      console.error(`回滚作品 ${work._id} 失败:`, err)
    }
  }

  return {
    success: true,
    message: `回滚完成，成功回滚 ${restoredCount} 个作品`,
    restoredCount: restoredCount
  }
}

async function getMigrationStatus() {
  const worksResult = await db.collection('works').get()
  const imagesResult = await db.collection('workImages').get()

  const migratedWorks = worksResult.data.filter(w => w.migrated).length
  const normalWorks = worksResult.data.filter(w => !w.migrated).length

  return {
    success: true,
    worksCount: worksResult.data.length,
    migratedWorks: migratedWorks,
    normalWorks: normalWorks,
    imagesCount: imagesResult.data.length
  }
}