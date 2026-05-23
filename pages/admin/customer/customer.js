const app = getApp()
const cloudStorage = require('../../../utils/cloudStorage.js')

Page({
  data: {
    photos: [],
    loading: false,
    albumName: '美丽瞬间',
    showRenameModal: false,
    newAlbumName: '',
    showModal: false,
    editMode: false,
    editId: '',
    formData: {
      imageUrl: '',
      description: '',
      order: 0
    }
  },

  onLoad: function () {
    this.loadAlbumName()
    this.loadPhotos()
  },

  onShow: function () {
    this.loadAlbumName()
    this.loadPhotos()
  },

  loadAlbumName() {
    const db = wx.cloud.database()
    db.collection('settings').doc('customerAlbum').get()
      .then(res => {
        if (res.data && res.data.albumName) {
          this.setData({ albumName: res.data.albumName })
        }
      })
      .catch(err => {
        if (err.errCode !== -502005) {
          console.error('加载相册名称失败:', err)
        }
      })
  },

  loadPhotos() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    db.collection('customerPhotos')
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
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  onAddPhoto() {
    this.setData({
      showModal: true,
      editMode: false,
      editId: '',
      formData: {
        imageUrl: '',
        description: '',
        order: this.data.photos.length
      }
    })
  },

  onEditPhoto(e) {
    const id = e.currentTarget.dataset.id
    const photo = this.data.photos.find(p => p._id === id)
    if (photo) {
      this.setData({
        showModal: true,
        editMode: true,
        editId: id,
        formData: {
          imageUrl: photo.imageUrl || '',
          description: photo.description || '',
          order: photo.order || 0
        }
      })
    }
  },

  onDeletePhoto(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('customerPhotos').doc(id).remove().then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadPhotos()
          }).catch(err => {
            console.error('删除失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  onRenameAlbum() {
    this.setData({
      showRenameModal: true,
      newAlbumName: this.data.albumName
    })
  },

  onAlbumNameInput(e) {
    this.setData({
      newAlbumName: e.detail.value
    })
  },

  onCloseRenameModal() {
    this.setData({ showRenameModal: false })
  },

  onSaveAlbumName() {
    const newAlbumName = this.data.newAlbumName.trim()
    
    if (!newAlbumName) {
      wx.showToast({
        title: '请输入相册名称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()
    db.collection('settings').doc('customerAlbum').set({
      data: {
        albumName: newAlbumName,
        updateTime: new Date()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      this.setData({
        albumName: newAlbumName,
        showRenameModal: false
      })
      this.updateTabBarAlbumName(newAlbumName)
    }).catch(err => {
      console.error('保存相册名称失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  },

  updateTabBarAlbumName(albumName) {
    const pages = getCurrentPages()
    const indexPage = pages.find(p => p.route === 'pages/index/index')
    const customerPage = pages.find(p => p.route === 'pages/customer/customer')
    const contactPage = pages.find(p => p.route === 'pages/contact/contact')
    
    ;[indexPage, customerPage, contactPage].forEach(page => {
      if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
        page.getTabBar().setData({ albumName })
      }
    })
  },

  onCloseModal() {
    this.setData({ showModal: false })
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })
        
        const cloudPath = `customerPhotos/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`
        
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          config: {
            header: {
              'x-cos-acl': 'public-read'
            }
          },
          success: uploadRes => {
            this.setData({
              'formData.imageUrl': uploadRes.fileID
            })
            wx.hideLoading()
          },
          fail: err => {
            console.error('上传失败:', err)
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },

  onDescInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  onOrderInput(e) {
    this.setData({
      'formData.order': e.detail.value
    })
  },

  onSavePhoto() {
    const { formData, editMode, editId } = this.data

    if (!formData.imageUrl) {
      wx.showToast({
        title: '请选择照片',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()
    const data = {
      imageUrl: formData.imageUrl,
      description: formData.description,
      order: Number(formData.order) || 0,
      hidden: false,
      createTime: new Date()
    }

    const savePromise = editMode 
      ? db.collection('customerPhotos').doc(editId).update({
          data: {
            imageUrl: formData.imageUrl,
            description: formData.description,
            order: Number(formData.order) || 0,
            updateTime: new Date()
          }
        })
      : db.collection('customerPhotos').add({ data })

    savePromise.then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      this.setData({ showModal: false })
      this.loadPhotos()
    }).catch(err => {
      console.error('保存失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  }
})