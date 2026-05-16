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
    },
    contactInfo: {
      name: '畔黛造型'
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ workId: options.id })
      this.loadWorkDetail(options.id)
    }
    this.loadContactInfo()
  },

  loadContactInfo: function () {
    const db = wx.cloud.database()
    db.collection('contactInfo').get().then(res => {
      if (res.data.length > 0) {
        const info = res.data[0]
        this.setData({
          contactInfo: {
            name: info.name || '畔黛造型'
          }
        })
      }
    }).catch(err => {
      console.error('加载联系信息失败:', err)
    })
  },

  loadWorkDetail(workId) {
    wx.showLoading({
      title: '加载中...'
    })

    const db = wx.cloud.database()
    
    db.collection('works').doc(workId).get()
      .then(workRes => {
        const work = workRes.data
        const imageFileIds = work.images || []
        
        console.log('作品图片数据:', imageFileIds)
        
        this.convertCloudStorageUrls(imageFileIds).then(convertedImages => {
          console.log('转换后的图片URL:', convertedImages)
          
          const validImages = convertedImages.filter(url => url && typeof url === 'string' && url.length > 0)
          
          this.setData({
            images: validImages,
            workInfo: {
              title: work.title || '作品详情',
              description: work.description || '',
              usageType: work.usageType || '',
              categoryName: work.categoryName || '',
              subcategoryName: work.subcategoryName || ''
            }
          })
          wx.hideLoading()
        }).catch(err => {
          console.error('转换图片URL失败:', err)
          this.setData({
            images: [],
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

  onImageError: function(e) {
    console.error('图片加载失败:', e.detail)
  },

  convertCloudStorageUrls: function(fileIds) {
    if (!fileIds || !Array.isArray(fileIds)) {
      return Promise.resolve([])
    }
    
    const cloudFileIds = fileIds.filter(id => id && id.startsWith('cloud://'))
    
    if (cloudFileIds.length === 0) {
      return Promise.resolve(fileIds)
    }
    
    return wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getTempFileURL',
        fileList: cloudFileIds
      }
    }).then(res => {
      const urlMap = res.result.urlMap || {}
      
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
    const companyName = this.data.contactInfo.name || '店家'
    const workTitle = this.data.workInfo.title || '该作品'
    
    wx.showModal({
      title: '联系我们',
      content: `将跳转到微信聊天，与${companyName}客服联系并发送${workTitle}的信息`,
      success: (res) => {
        if (res.confirm) {
          wx.openCustomerServiceChat({
            sendMessage: {
              title: workTitle,
              content: `我对「${workTitle}」感兴趣，想了解更多详情`,
              link: `/pages/detail/detail?id=${this.data.workId}`
            },
            success: () => {
              console.log('打开客服聊天成功')
            },
            fail: (err) => {
              console.error('打开客服聊天失败:', err)
              wx.showToast({
                title: '无法打开客服聊天',
                icon: 'error'
              })
            }
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
