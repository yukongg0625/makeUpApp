const cloudStorage = require('../../../utils/cloudStorage.js')

Page({
  data: {
    formData: {
      name: '',
      description: ''
    },
    qrcodeUrl: '',
    qrcodeFileId: '',
    loading: true
  },

  onLoad: function () {
    this.loadContactInfo()
  },

  loadContactInfo: function () {
    const db = wx.cloud.database()
    db.collection('contactInfo').limit(1).get().then(res => {
      if (res.data.length > 0) {
        const contactInfo = res.data[0]
        this.setData({
          formData: {
            name: contactInfo.name || '',
            description: contactInfo.description || ''
          },
          qrcodeFileId: contactInfo.qrcodeFileId || '',
          loading: false
        })
        if (contactInfo.qrcodeFileId) {
          this.convertImageUrl(contactInfo.qrcodeFileId)
        }
      } else {
        this.setData({
          formData: {
            name: '畔黛造型',
            description: '专业化妆造型服务'
          },
          loading: false
        })
      }
    }).catch(err => {
      console.error('加载联系信息失败:', err)
      this.setData({ loading: false })
    })
  },

  convertImageUrl: function(fileId) {
    if (!fileId) return
    cloudStorage.getTempFileURL([fileId]).then(urlMap => {
      if (urlMap[fileId]) {
        this.setData({ qrcodeUrl: urlMap[fileId] })
      }
    }).catch(err => {
      console.error('获取临时URL失败:', err)
    })
  },

  onNameInput: function (e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  onDescriptionInput: function (e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  onChooseImage: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadQrcode(tempFilePath)
      }
    })
  },

  onRechooseImage: function () {
    this.onChooseImage()
  },

  onRemoveImage: function () {
    wx.showModal({
      title: '删除二维码',
      content: '确定要删除二维码图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            qrcodeUrl: '',
            qrcodeFileId: ''
          })
        }
      }
    })
  },

  uploadQrcode: function (tempFilePath) {
    wx.showLoading({ title: '上传中...' })

    const cloudPath = `contact/qrcode_${Date.now()}.jpg`

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
          qrcodeFileId: uploadRes.fileID,
          qrcodeUrl: ''
        })
        this.convertImageUrl(uploadRes.fileID)
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
  },

  onSave: function () {
    const { name, description } = this.data.formData

    if (!name) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()

    db.collection('contactInfo').limit(1).get().then(res => {
      const data = {
        name,
        description,
        qrcodeFileId: this.data.qrcodeFileId,
        updateTime: new Date()
      }

      if (res.data.length > 0) {
        const docId = res.data[0]._id
        return db.collection('contactInfo').doc(docId).update({ data })
      } else {
        data.createTime = new Date()
        return db.collection('contactInfo').add({ data })
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000
      })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'error' })
      console.error('保存联系信息失败:', err)
    })
  }
})
