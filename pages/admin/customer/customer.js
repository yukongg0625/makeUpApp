const app = getApp()

Page({
  data: {
    photos: [],
    loading: false,
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
    this.loadPhotos()
  },

  onShow: function () {
    this.loadPhotos()
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