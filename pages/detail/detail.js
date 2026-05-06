Page({
  data: {
    workId: null,
    images: [],
    currentImageIndex: 0,
    workInfo: {
      title: '',
      description: '',
      usageType: '',
      categoryName: '',
      subcategoryName: ''
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ workId: options.id })
      this.loadWorkDetail(options.id)
    }
  },

  loadWorkDetail(workId) {
    wx.showLoading({
      title: '加载中...'
    })

    const db = wx.cloud.database()
    db.collection('works').doc(workId).get()
      .then(res => {
        const work = res.data
        const images = work.images || []
        
        // 转换云存储 File ID 为临时 URL
        this.convertCloudStorageUrls(images).then(convertedImages => {
          this.setData({
            images: convertedImages,
            workInfo: {
              title: work.title || '作品详情',
              description: work.description || '',
              usageType: work.usageType || '',
              categoryName: work.categoryName || '',
              subcategoryName: work.subcategoryName || ''
            }
          })
          wx.hideLoading()
        })
      })
      .catch(err => {
        console.error('加载作品详情失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'error' })
      })
  },

  convertCloudStorageUrls: function(fileIds) {
    const cloudFileIds = fileIds.filter(id => id && id.startsWith('cloud://'))
    
    if (cloudFileIds.length === 0) {
      return Promise.resolve(fileIds)
    }
    
    return wx.cloud.getTempFileURL({
      fileList: cloudFileIds
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(file => {
        urlMap[file.fileID] = file.tempFileURL
      })
      
      return fileIds.map(id => {
        if (id && id.startsWith('cloud://')) {
          return urlMap[id] || id
        }
        return id
      })
    }).catch(err => {
      console.error('转换云存储 URL 失败:', err)
      return fileIds
    })
  },

  onImageChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.shareAppMessage({
            title: this.data.workInfo.title,
            path: `/pages/detail/detail?id=${this.data.workId}`
          })
        } else if (res.tapIndex === 1) {
          wx.shareTimeline({
            title: this.data.workInfo.title,
            query: `id=${this.data.workId}`,
            imageUrl: this.data.images[0]
          })
        }
      }
    })
  },

  onContactShop() {
    // 模拟跳转到微信聊天
    wx.showModal({
      title: '联系店家',
      content: '将跳转到微信聊天，与畔黛造型客服联系',
      success: function (res) {
        if (res.confirm) {
          wx.showToast({
            title: '正在打开微信聊天...',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.workInfo.title,
      path: `/pages/detail/detail?id=${this.data.workId}`,
      imageUrl: this.data.images[0]
    }
  }
})
