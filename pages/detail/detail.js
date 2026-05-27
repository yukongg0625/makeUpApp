const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    workId: null,
    categoryId: '',
    subcategoryId: '',
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
    },
    showContactModal: false,
    contactMessage: '',
    showImageSavedTip: false,
    middleTabText: '美丽瞬间',
    middleTabUrl: '',
    
    likes: 0,
    isLiked: false,
    comments: [],
    commentText: '',
    showComments: false,
    loginModalVisible: false
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ workId: options.id })
      this.loadWorkDetail(options.id)
      this.loadLikes(options.id)
      this.loadComments(options.id)
    }
    this.loadContactInfo()
  },

  loadContactInfo: function () {
    const db = wx.cloud.database()
    db.collection('contactInfo').limit(1).get().then(res => {
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
            categoryId: work.categoryId || '',
            subcategoryId: work.subcategoryId || '',
            workInfo: {
              title: work.title || '作品详情',
              description: work.description || '',
              usageType: work.usageType || '',
              categoryName: work.categoryName || '',
              subcategoryName: work.subcategoryName || ''
            }
          })
          this.updateTabBar()
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
          this.updateTabBar()
          wx.hideLoading()
        })
      })
      .catch(err => {
        console.error('加载作品详情失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'error' })
      })
  },

  loadLikes(workId) {
    const db = wx.cloud.database()
    const _ = db.command
    
    Promise.all([
      db.collection('likes').where({ workId: workId }).count(),
      db.collection('likes').where({
        workId: workId,
        userId: _.eq(getApp().globalData.userId)
      }).get()
    ]).then(([countRes, likeRes]) => {
      this.setData({
        likes: countRes.total || 0,
        isLiked: likeRes.data && likeRes.data.length > 0
      })
    }).catch(err => {
      console.error('加载点赞数据失败:', err)
    })
  },

  loadComments(workId) {
    const db = wx.cloud.database()
    
    db.collection('comments')
      .where({ workId: workId })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const comments = res.data.map(comment => ({
          ...comment,
          avatarUrl: comment.avatarUrl || '',
          nickName: comment.nickName || '匿名用户',
          createTime: this.formatTime(comment.createTime)
        }))
        this.setData({ comments })
      }).catch(err => {
        console.error('加载评论失败:', err)
      })
  },

  formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  updateTabBar() {
    const subcategoryName = this.data.workInfo.subcategoryName || ''
    const categoryId = this.data.categoryId || ''
    const subcategoryId = this.data.subcategoryId || ''
    const categoryName = this.data.workInfo.categoryName || ''
    
    if (subcategoryName && categoryId && subcategoryId) {
      this.setData({
        middleTabText: subcategoryName,
        middleTabUrl: `/pages/feature/feature?id=${categoryId}&name=${encodeURIComponent(categoryName)}&subcategoryId=${subcategoryId}`
      })
    } else {
      this.setData({
        middleTabText: '美丽瞬间',
        middleTabUrl: ''
      })
    }
  },

  onImageError: function(e) {
    console.error('图片加载失败:', e.detail)
  },

  onImageLoad: function(e) {
  },

  convertCloudStorageUrls: function(fileIds) {
    if (!fileIds || !Array.isArray(fileIds)) {
      return Promise.resolve([])
    }
    
    const cloudFileIds = fileIds.filter(id => id && id.startsWith('cloud://'))
    
    if (cloudFileIds.length === 0) {
      return Promise.resolve(fileIds)
    }
    
    return cloudStorage.getTempFileURL(cloudFileIds).then(urlMap => {
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

  onContactBubbleTap() {
    console.log('联系按钮被点击')
    
    const workTitle = this.data.workInfo.title || '该作品'
    const categoryName = this.data.workInfo.categoryName || ''
    const subcategoryName = this.data.workInfo.subcategoryName || ''
    const usageType = this.data.workInfo.usageType || ''
    
    let messageContent = `我对「${workTitle}」感兴趣，想了解更多详情`
    if (categoryName) messageContent += `\n影集：${categoryName}`
    if (subcategoryName) messageContent += `\n子类：${subcategoryName}`
    if (usageType) messageContent += `\n作品：${usageType}`
    
    if (messageContent && messageContent.length > 0) {
      wx.setClipboardData({
        data: messageContent,
        success: () => {
          console.log('作品信息已复制到剪贴板')
        },
        fail: (err) => {
          console.error('复制失败:', err)
        }
      })
    }
    
    this.setData({
      showContactModal: true,
      contactMessage: messageContent
    })
  },

  onCloseContactModal() {
    this.setData({
      showContactModal: false,
      contactMessage: ''
    })
  },

  onContactSessionEnd(e) {
    console.log('客服会话结束', e)
    this.setData({
      showContactModal: false,
      contactMessage: ''
    })
  },

  onCopyImageAndContact() {
    const coverImage = this.data.images[0] || ''
    
    if (!coverImage) {
      wx.showToast({
        title: '暂无图片',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存图片中...' })
    
    wx.downloadFile({
      url: coverImage,
      success: (downloadRes) => {
        wx.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath,
          success: () => {
            wx.hideLoading()
            this.setData({ showImageSavedTip: true })
            
            wx.showModal({
              title: '图片已保存',
              content: '作品图片已保存到相册，请在客服聊天中发送图片给客服',
              confirmText: '打开客服',
              cancelText: '稍后再说',
              success: (res) => {
                this.setData({ showImageSavedTip: false })
                if (res.confirm) {
                  wx.showToast({
                    title: '请点击下方"直接联系"按钮',
                    icon: 'none',
                    duration: 2000
                  })
                }
              }
            })
          },
          fail: (saveErr) => {
            wx.hideLoading()
            console.error('保存图片失败:', saveErr)
            if (saveErr.errMsg.includes('auth')) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中允许访问相册',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'error'
              })
            }
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载图片失败:', err)
        wx.showToast({
          title: '图片下载失败',
          icon: 'error'
        })
      }
    })
  },

  stopPropagation() {},

  onShareAppMessage() {
    return {
      title: this.data.workInfo.title,
      path: `/pages/detail/detail?id=${this.data.workId}`,
      imageUrl: this.data.images[0]
    }
  },

  switchTab(e) {
    const page = e.currentTarget.dataset.page
    wx.switchTab({ url: page })
  },

  onMiddleTabTap() {
    if (this.data.middleTabUrl) {
      wx.navigateTo({ url: this.data.middleTabUrl })
    } else {
      wx.switchTab({ url: '/pages/customer/customer' })
    }
  },

  onLikeTap() {
    const app = getApp()
    if (!app.globalData.userId) {
      this.setData({ loginModalVisible: true })
      return
    }

    const db = wx.cloud.database()
    const workId = this.data.workId
    const userId = app.globalData.userId

    if (this.data.isLiked) {
      db.collection('likes').where({
        workId: workId,
        userId: userId
      }).get().then(res => {
        if (res.data && res.data.length > 0) {
          return db.collection('likes').doc(res.data[0]._id).remove()
        }
      }).then(() => {
        this.setData({
          likes: this.data.likes - 1,
          isLiked: false
        })
      }).catch(err => {
        console.error('取消点赞失败:', err)
      })
    } else {
      db.collection('likes').add({
        data: {
          workId: workId,
          userId: userId,
          createTime: db.serverDate()
        }
      }).then(() => {
        this.setData({
          likes: this.data.likes + 1,
          isLiked: true
        })
      }).catch(err => {
        console.error('点赞失败:', err)
      })
    }
  },

  onShowComments() {
    this.setData({ showComments: true })
  },

  onHideComments() {
    this.setData({ showComments: false })
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  onSubmitComment() {
    const app = getApp()
    if (!app.globalData.userId) {
      this.setData({ loginModalVisible: true })
      return
    }

    const commentText = this.data.commentText.trim()
    if (!commentText) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    const db = wx.cloud.database()
    db.collection('comments').add({
      data: {
        workId: this.data.workId,
        userId: app.globalData.userId,
        nickName: app.globalData.userInfo.nickName,
        avatarUrl: app.globalData.userInfo.avatarUrl,
        content: commentText,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.showToast({ title: '评论成功', icon: 'success' })
      this.setData({ commentText: '' })
      this.loadComments(this.data.workId)
    }).catch(err => {
      console.error('发表评论失败:', err)
      wx.showToast({ title: '评论失败', icon: 'error' })
    })
  },

  onLogin() {
    const app = getApp()
    app.login().then(() => {
      this.setData({ loginModalVisible: false })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败', icon: 'error' })
    })
  },

  onCloseLoginModal() {
    this.setData({ loginModalVisible: false })
  }
})