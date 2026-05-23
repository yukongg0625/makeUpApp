// pages/admin/categories/categories.js
const cloudStorage = require('../../../utils/cloudStorage.js')
Page({
  data: {
    categories: [],
    loading: true,
    showModal: false,
    editMode: false,
    editId: null,
    formData: {
      name: '',
      coverImage: '',
      coverFileId: '',
      order: 1,
      hidden: false
    }
  },

  onLoad: function (options) {
    this.loadCategories()
  },

  onShow: function () {
    this.loadCategories()
  },

  loadCategories: function () {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('categories')
      .where({
        _id: _.exists(true)
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const categories = res.data.map(item => ({
          ...item,
          _originalCoverImage: item.coverImage
        }))

        this.convertCloudStorageUrls(categories, 'coverImage').then(convertedCategories => {
          this.setData({
            categories: convertedCategories,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载影集失败:', err)
        this.setData({ loading: false })
      })
  },

  convertCloudStorageUrls: function (data, fieldName) {
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  onAddCategory: function () {
    this.setData({
      showModal: true,
      editMode: false,
      editId: null,
      formData: {
        name: '',
        coverImage: '',
        order: this.data.categories.length + 1,
        hidden: false
      }
    })
  },

  onEditCategory: function (e) {
    const id = e.currentTarget.dataset.id
    const category = this.data.categories.find(item => item._id === id)

    if (category) {
      this.setData({
        showModal: true,
        editMode: true,
        editId: id,
        formData: {
          name: category.name,
          coverImage: category.coverImage,
          coverFileId: category._originalCoverImage || category.coverImage,
          order: category.order,
          hidden: category.hidden || false
        }
      })
    }
  },

  onDeleteCategory: function (e) {
    const id = e.currentTarget.dataset.id
    const category = this.data.categories.find(item => item._id === id)

    wx.showModal({
      title: '确认删除',
      content: `删除"${category ? category.name : '影集'}"将同时删除其下所有子类、作品和图片，确定要删除吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteCategory(id)
        }
      }
    })
  },

  deleteCategory: function (id) {
    wx.showLoading({ title: '删除中...' })

    wx.cloud.callFunction({
      name: 'cascadeDelete',
      data: {
        action: 'deleteCategory',
        categoryId: id
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadCategories()
      } else {
        wx.showToast({ title: res.result.message || '删除失败', icon: 'error' })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'error' })
      console.error('删除影集失败:', err)
    })
  },

  onToggleHidden: function () {
    const currentValue = this.data.formData.hidden
    this.setData({
      'formData.hidden': !currentValue
    })
  },

  onNameInput: function (e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onOrderInput: function (e) {
    const value = e.detail.value
    this.setData({
      'formData.order': value === '' ? '' : (parseInt(value) || 1)
    })
  },

  onUploadCover: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  uploadImage: function (filePath) {
    wx.showLoading({ title: '上传中...' })

    const fileName = 'categories/' + Date.now() + '.jpg'

    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      config: {
        header: {
          'x-cos-acl': 'public-read'
        }
      },
      success: (res) => {
        wx.hideLoading()
        this.setData({
          'formData.coverImage': res.fileID,
          'formData.coverFileId': res.fileID
        })
        wx.showToast({ title: '上传成功', icon: 'success' })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传图片失败:', err)
      }
    })
  },

  onSaveCategory: function () {
    const { name, coverImage, coverFileId, order, hidden } = this.data.formData

    if (!name) {
      wx.showToast({ title: '请输入影集名称', icon: 'none' })
      return
    }

    const db = wx.cloud.database()
    const checkPromise = this.data.editMode
      ? db.collection('categories')
        .where({
          name: name,
          _id: db.command.neq(this.data.editId)
        })
        .get()
      : db.collection('categories').where({ name: name }).get()

    checkPromise.then(res => {
      if (res.data.length > 0) {
        wx.showToast({ title: '影集名称已存在', icon: 'none' })
        return
      }

      this.saveCategory(name, coverImage, coverFileId, order, hidden)
    }).catch(err => {
      console.error('检查名称失败:', err)
      wx.showToast({ title: '检查失败', icon: 'none' })
    })
  },

  saveCategory: function (name, coverImage, coverFileId, order, hidden) {
    const saveCoverImage = coverFileId || (coverImage.startsWith('cloud://') ? coverImage : '')

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()

    if (this.data.editMode) {
      // 获取旧封面图片 ID
      const oldCategory = this.data.categories.find(item => item._id === this.data.editId)
      const oldCoverImage = oldCategory ? oldCategory._originalCoverImage : null

      db.collection('categories').doc(this.data.editId).update({
        data: {
          name: name,
          coverImage: saveCoverImage,
          order: order,
          hidden: hidden
        }
      }).then(() => {
        // 删除旧封面图片
        if (oldCoverImage && oldCoverImage !== saveCoverImage && oldCoverImage.startsWith('cloud://')) {
          wx.cloud.deleteFile({
            fileList: [oldCoverImage]
          }).then(res => {
            console.log('删除旧封面图片成功:', res)
          }).catch(err => {
            console.error('删除旧封面图片失败:', err)
          })
        }

        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.onCloseModal()
        this.loadCategories()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'error' })
        console.error('更新影集失败:', err)
      })
    } else {
      db.collection('categories').add({
        data: {
          name: name,
          coverImage: saveCoverImage,
          order: order,
          hidden: hidden,
          enabled: true
        }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.onCloseModal()
        this.loadCategories()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'error' })
        console.error('添加影集失败:', err)
      })
    }
  },

  onCloseModal: function () {
    this.setData({
      showModal: false,
      editMode: false,
      editId: null,
      formData: {
        name: '',
        coverImage: '',
        order: 1,
        hidden: false
      }
    })
  }
})