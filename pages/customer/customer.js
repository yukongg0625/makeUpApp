Page({
  data: {
    photos: [],
    loading: false
  },

  onLoad: function () {
    this.loadPhotos()
  },

  onShow: function () {
    this.loadPhotos()
  },

  loadPhotos() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    db.collection('customerPhotos')
      .where({ hidden: false })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const photos = res.data
        this.convertCloudStorageUrls(photos, 'imageUrl').then(convertedPhotos => {
          this.setData({
            photos: convertedPhotos,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载客照失败:', err)
        this.setData({ loading: false })
      })
  },

  // 转换云存储 File ID 为临时 URL
  convertCloudStorageUrls: function(data, fieldName) {
    const fileIds = data
      .filter(item => item[fieldName] && item[fieldName].startsWith('cloud://'))
      .map(item => item[fieldName])
    
    if (fileIds.length === 0) {
      return Promise.resolve(data)
    }
    
    return wx.cloud.getTempFileURL({
      fileList: fileIds
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(file => {
        urlMap[file.fileID] = file.tempFileURL
      })
      
      return data.map(item => {
        if (item[fieldName] && item[fieldName].startsWith('cloud://')) {
          return {
            ...item,
            [fieldName]: urlMap[item[fieldName]] || item[fieldName]
          }
        }
        return item
      })
    }).catch(err => {
      console.error('转换云存储 URL 失败:', err)
      return data
    })
  },

  onPhotoTap(e) {
    const photoId = e.currentTarget.dataset.id
    const photo = this.data.photos.find(p => p._id === photoId)
    if (photo) {
      wx.previewImage({
        urls: [photo.imageUrl],
        current: photo.imageUrl
      })
    }
  },

  onPullDownRefresh() {
    this.loadPhotos()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})