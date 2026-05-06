// pages/admin/featured/featured.js
Page({
  data: {
    works: [],
    featured: [],
    workTitles: [],
    loading: true,
    showModal: false,
    editMode: false,
    editId: null,
    formData: {
      workId: '',
      workTitle: '',
      workIndex: -1,
      order: 1
    }
  },

  onLoad: function (options) {
    this.loadWorks()
    this.loadFeatured()
  },

  loadWorks: function () {
    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection('works')
      .where({
        _id: _.exists(true)
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const works = res.data
        const workTitles = works.map(item => item.title)
        
        this.setData({
          works: works,
          workTitles: workTitles
        })
      })
      .catch(err => {
        console.error('加载作品失败:', err)
      })
  },

  loadFeatured: function () {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection('featured')
      .where({
        _id: _.exists(true)
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const featured = res.data.map(item => ({
          ...item,
          coverUrl: item.coverImage || ''
        }))
        
        // 转换云存储 File ID 为临时 URL
        this.convertCloudStorageUrls(featured, 'coverUrl').then(convertedFeatured => {
          this.setData({
            featured: convertedFeatured,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载精华作品失败:', err)
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

  onAddFeatured: function () {
    this.setData({
      showModal: true,
      editMode: false,
      editId: null,
      formData: {
        workId: '',
        workTitle: '',
        workIndex: -1,
        order: this.data.featured.length + 1
      }
    })
  },

  onEditFeatured: function (e) {
    const id = e.currentTarget.dataset.id
    const featured = this.data.featured.find(item => item._id === id)
    
    if (featured) {
      const workIndex = this.data.works.findIndex(
        work => work._id === featured.workId
      )
      
      this.setData({
        showModal: true,
        editMode: true,
        editId: id,
        formData: {
          workId: featured.workId,
          workTitle: featured.title,
          workIndex: workIndex,
          order: featured.order
        }
      })
    }
  },

  onDeleteFeatured: function (e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteFeatured(id)
        }
      }
    })
  },

  deleteFeatured: function (id) {
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'deleteDocument',
      data: {
        collection: 'featured',
        id: id
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadFeatured()
      } else {
        wx.showToast({ title: res.result.message || '删除失败', icon: 'error' })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'error' })
      console.error('删除精华作品失败:', err)
    })
  },

  onWorkPickerChange: function (e) {
    const index = parseInt(e.detail.value)
    const work = this.data.works[index]
    
    this.setData({
      'formData.workId': work._id,
      'formData.workTitle': work.title,
      'formData.workIndex': index
    })
  },

  onOrderInput: function (e) {
    const value = e.detail.value
    this.setData({
      'formData.order': value === '' ? '' : (parseInt(value) || 1)
    })
  },

  onSaveFeatured: function () {
    const { workId, workTitle, order } = this.data.formData
    
    if (!workId) {
      wx.showToast({ title: '请选择作品', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const db = wx.cloud.database()
    
    // 获取作品信息
    const work = this.data.works.find(item => item._id === workId)
    
    if (!work) {
      wx.hideLoading()
      wx.showToast({ title: '作品不存在', icon: 'error' })
      return
    }
    
    const data = {
      workId: workId,
      title: work.title,
      categoryId: work.categoryId,
      categoryName: work.categoryName,
      subcategoryId: work.subcategoryId,
      subcategoryName: work.subcategoryName,
      coverImage: work.coverImage,
      images: work.images,
      usageType: work.usageType,
      description: work.description,
      order: order
    }
    
    if (this.data.editMode) {
      db.collection('featured').doc(this.data.editId).update({
        data: data
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.onCloseModal()
        this.loadFeatured()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'error' })
        console.error('更新精华作品失败:', err)
      })
    } else {
      db.collection('featured').add({
        data: data
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.onCloseModal()
        this.loadFeatured()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'error' })
        console.error('添加精华作品失败:', err)
      })
    }
  },

  onCloseModal: function () {
    this.setData({
      showModal: false,
      editMode: false,
      editId: null,
      formData: {
        workId: '',
        workTitle: '',
        workIndex: -1,
        order: 1
      }
    })
  }
})
