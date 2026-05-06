// pages/admin/works/works.js
Page({
  data: {
    categories: [],
    subcategories: [],
    works: [],
    categoryNames: [],
    subcategoryNames: [],
    currentSubcategoryNames: [],
    selectedCategoryIndex: -1,
    selectedCategoryName: '全部影集',
    selectedSubcategoryIndex: -1,
    selectedSubcategoryName: '全部子类',
    usageTypes: ['服装租赁', '整体造型', '化妆造型'],
    loading: true,
    showModal: false,
    editMode: false,
    editId: null,
    showSubcategoryPicker: false,
    formData: {
      categoryId: '',
      categoryName: '',
      categoryIndex: -1,
      subcategoryId: '',
      subcategoryName: '',
      subcategoryIndex: -1,
      title: '',
      coverUrl: '',
      coverFileId: '',
      images: [],
      imageFileIds: [],
      usageType: '',
      usageTypeIndex: -1,
      description: '',
      order: 1,
      isFeatured: false
    }
  },

  onLoad: function (options) {
    this.loadCategories()
    this.loadSubcategories()
    this.loadWorks()
  },

  onShow: function () {
    this.loadCategories()
    this.loadSubcategories()
    this.loadWorks()
  },

  loadCategories: function () {
    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection('categories')
      .where({
        _id: _.exists(true)
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const categories = res.data
        const categoryNames = categories.map(item => item.name)
        
        this.setData({
          categories: categories,
          categoryNames: categoryNames
        })
      })
      .catch(err => {
        console.error('加载影集失败:', err)
      })
  },

  loadSubcategories: function (categoryId) {
    const db = wx.cloud.database()
    const _ = db.command
    
    let query = db.collection('subcategories')
    
    if (categoryId) {
      query = query.where({ categoryId: categoryId })
    } else {
      query = query.where({ _id: _.exists(true) })
    }
    
    query.orderBy('order', 'asc')
      .get()
      .then(res => {
        const subcategories = res.data
        const subcategoryNames = subcategories.map(item => item.name)
        
        this.setData({
          subcategories: subcategories,
          subcategoryNames: subcategoryNames
        })
      })
      .catch(err => {
        console.error('加载子类失败:', err)
      })
  },

  loadWorks: function (categoryId, subcategoryId) {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    const _ = db.command
    let query = db.collection('works')
    
    const conditions = {}
    if (categoryId) {
      conditions.categoryId = categoryId
    }
    if (subcategoryId) {
      conditions.subcategoryId = subcategoryId
    }
    
    if (Object.keys(conditions).length > 0) {
      query = query.where(conditions)
    }
    
    query.orderBy('order', 'asc')
      .get()
      .then(res => {
        const works = res.data.map(item => ({
          ...item,
          coverUrl: item.coverImage || '',
          _originalCoverImage: item.coverImage || '',
          _originalImages: [...(item.images || [])]
        }))
        
        // 转换云存储 File ID 为临时 URL
        this.convertCloudStorageUrls(works, 'coverUrl').then(convertedWorks => {
          // 转换作品图片列表
          return this.convertCloudStorageUrlsForImages(convertedWorks)
        }).then(finalWorks => {
          this.setData({
            works: finalWorks,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载作品失败:', err)
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

  // 转换作品图片列表
  convertCloudStorageUrlsForImages: function(works) {
    const allFileIds = []
    works.forEach(work => {
      if (work.images && Array.isArray(work.images)) {
        work.images.forEach(fileId => {
          if (fileId && fileId.startsWith('cloud://')) {
            allFileIds.push(fileId)
          }
        })
      }
    })
    
    if (allFileIds.length === 0) {
      return Promise.resolve(works)
    }
    
    return wx.cloud.getTempFileURL({
      fileList: allFileIds
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(file => {
        urlMap[file.fileID] = file.tempFileURL
      })
      
      return works.map(work => {
        if (work.images && Array.isArray(work.images)) {
          // 创建新数组，不修改原始 _originalImages
          const convertedImages = work.images.map(fileId => {
            return urlMap[fileId] || fileId
          })
          return {
            ...work,
            images: convertedImages
          }
        }
        return work
      })
    }).catch(err => {
      console.error('转换作品图片 URL 失败:', err)
      return works
    })
  },

  onCategoryChange: function (e) {
    const index = parseInt(e.detail.value)
    
    if (index === -1) {
      this.setData({
        selectedCategoryIndex: -1,
        selectedCategoryName: '全部影集',
        selectedSubcategoryIndex: -1,
        selectedSubcategoryName: '全部子类'
      })
      this.loadSubcategories()
      this.loadWorks()
    } else {
      const category = this.data.categories[index]
      this.setData({
        selectedCategoryIndex: index,
        selectedCategoryName: category.name,
        selectedSubcategoryIndex: -1,
        selectedSubcategoryName: '全部子类'
      })
      this.loadSubcategories(category._id)
      this.loadWorks(category._id)
    }
  },

  onSubcategoryChange: function (e) {
    const index = parseInt(e.detail.value)
    
    if (index === -1) {
      this.setData({
        selectedSubcategoryIndex: -1,
        selectedSubcategoryName: '全部子类'
      })
      const categoryId = this.data.selectedCategoryIndex === -1 ? null : this.data.categories[this.data.selectedCategoryIndex]._id
      this.loadWorks(categoryId)
    } else {
      const subcategory = this.data.subcategories[index]
      this.setData({
        selectedSubcategoryIndex: index,
        selectedSubcategoryName: subcategory.name
      })
      this.loadWorks(subcategory.categoryId, subcategory._id)
    }
  },

  onAddWork: function () {
    const selectedCategoryId = this.data.selectedCategoryIndex === -1 ? '' : this.data.categories[this.data.selectedCategoryIndex]._id
    const selectedCategoryName = this.data.selectedCategoryIndex === -1 ? '' : this.data.categories[this.data.selectedCategoryIndex].name
    const selectedSubcategoryId = this.data.selectedSubcategoryIndex === -1 ? '' : this.data.subcategories[this.data.selectedSubcategoryIndex]._id
    const selectedSubcategoryName = this.data.selectedSubcategoryIndex === -1 ? '' : this.data.subcategories[this.data.selectedSubcategoryIndex].name
    
    const currentSubcategories = selectedCategoryId ? this.data.subcategories.filter(
      sub => String(sub.categoryId) === String(selectedCategoryId)
    ) : []
    const currentSubcategoryNames = currentSubcategories.map(sub => sub.name)
    
    this.setData({
      showModal: true,
      editMode: false,
      editId: null,
      showSubcategoryPicker: !!selectedCategoryId,
      formData: {
        categoryId: selectedCategoryId,
        categoryName: selectedCategoryName,
        categoryIndex: this.data.selectedCategoryIndex,
        subcategoryId: selectedSubcategoryId,
        subcategoryName: selectedSubcategoryName,
        subcategoryIndex: this.data.selectedSubcategoryIndex,
        title: '',
        coverUrl: '',
        coverFileId: '',
        images: [],
        imageFileIds: [],
        usageType: '',
        usageTypeIndex: -1,
        description: '',
        order: 1,
        isFeatured: false
      },
      currentSubcategoryNames: currentSubcategoryNames,
      _currentSubcategories: currentSubcategories
    })
  },

  onEditWork: function (e) {
    const id = e.currentTarget.dataset.id
    const work = this.data.works.find(item => item._id === id)
    
    if (work) {
      const categoryIndex = this.data.categories.findIndex(
        cat => cat._id === work.categoryId
      )
      
      const subcategoryIndex = this.data.subcategories.findIndex(
        sub => sub._id === work.subcategoryId
      )
      
      const usageTypeIndex = this.data.usageTypes.indexOf(work.usageType)
      
      const currentSubcategories = this.data.subcategories.filter(
        sub => String(sub.categoryId) === String(work.categoryId)
      )
      
      // 获取原始 File ID（在转换前保存的）
      const originalCoverFileId = work._originalCoverImage || work.coverImage || ''
      const originalImageFileIds = work._originalImages || work.images || []
      
      this.setData({
        showModal: true,
        editMode: true,
        editId: id,
        showSubcategoryPicker: true,
        formData: {
          categoryId: work.categoryId,
          categoryName: work.categoryName,
          categoryIndex: categoryIndex,
          subcategoryId: work.subcategoryId,
          subcategoryName: work.subcategoryName,
          subcategoryIndex: subcategoryIndex,
          title: work.title,
          coverUrl: work.coverUrl || '',
          coverFileId: originalCoverFileId,
          images: work.images || [],
          imageFileIds: originalImageFileIds,
          usageType: work.usageType,
          usageTypeIndex: usageTypeIndex,
          description: work.description || '',
          order: work.order,
          isFeatured: work.isFeatured || false
        },
        currentSubcategoryNames: currentSubcategories.map(sub => sub.name),
        _currentSubcategories: currentSubcategories
      })
    }
  },

  onDeleteWork: function (e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteWork(id)
        }
      }
    })
  },

  deleteWork: function (id) {
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'deleteDocument',
      data: {
        collection: 'works',
        id: id
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadWorks()
      } else {
        wx.showToast({ title: res.result.message || '删除失败', icon: 'error' })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'error' })
      console.error('删除作品失败:', err)
    })
  },

  onCategoryPickerChange: function (e) {
    const index = parseInt(e.detail.value)
    const category = this.data.categories[index]
    
    console.log('选择影集:', category._id, category.name)
    console.log('所有子类:', this.data.subcategories)
    
    const currentSubcategories = this.data.subcategories.filter(
      sub => {
        console.log('比较:', sub.categoryId, '===', category._id, '->', String(sub.categoryId) === String(category._id))
        return String(sub.categoryId) === String(category._id)
      }
    )
    const currentSubcategoryNames = currentSubcategories.map(sub => sub.name)
    
    console.log('过滤后的子类:', currentSubcategories)
    console.log('子类名称:', currentSubcategoryNames)
    
    // First clear the picker to force destruction
    this.setData({
      'formData.categoryId': category._id,
      'formData.categoryName': category.name,
      'formData.categoryIndex': index,
      'formData.subcategoryId': '',
      'formData.subcategoryName': '',
      'formData.subcategoryIndex': -1,
      currentSubcategoryNames: [],
      _currentSubcategories: [],
      showSubcategoryPicker: false
    }, () => {
      // Then set the new values to force recreation
      this.setData({
        currentSubcategoryNames: currentSubcategoryNames,
        _currentSubcategories: currentSubcategories,
        showSubcategoryPicker: true
      })
    })
  },

  onSubcategoryPickerChange: function (e) {
    const index = parseInt(e.detail.value)
    const currentSubcategories = this.data._currentSubcategories || []
    
    if (index < 0 || index >= currentSubcategories.length) {
      console.error('子类索引越界:', index, currentSubcategories.length)
      return
    }
    
    const subcategory = currentSubcategories[index]
    
    this.setData({
      'formData.subcategoryId': subcategory._id,
      'formData.subcategoryName': subcategory.name,
      'formData.subcategoryIndex': index
    })
  },

  onTitleInput: function (e) {
    this.setData({
      'formData.title': e.detail.value
    })
  },

  onDescriptionInput: function (e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  onOrderInput: function (e) {
    const value = e.detail.value
    this.setData({
      'formData.order': value === '' ? '' : (parseInt(value) || 1)
    })
  },

  onUsageTypeChange: function (e) {
    const index = parseInt(e.detail.value)
    this.setData({
      'formData.usageType': this.data.usageTypes[index],
      'formData.usageTypeIndex': index
    })
  },

  onFeaturedChange: function (e) {
    this.setData({
      'formData.isFeatured': e.detail.value
    })
  },

  onUploadCover: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath, 'cover')
      }
    })
  },

  onUploadImages: function () {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles
        tempFiles.forEach(file => {
          this.uploadImage(file.tempFilePath, 'images')
        })
      }
    })
  },

  onDeleteImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.images
    const imageFileIds = this.data.formData.imageFileIds
    
    images.splice(index, 1)
    imageFileIds.splice(index, 1)
    
    this.setData({
      'formData.images': images,
      'formData.imageFileIds': imageFileIds
    })
  },

  uploadImage: function (filePath, type) {
    wx.showLoading({ title: '上传中...' })
    
    const fileName = 'works/' + Date.now() + Math.random().toString(36).substr(2, 9) + '.jpg'
    
    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: (res) => {
        wx.hideLoading()
        
        if (type === 'cover') {
          this.setData({
            'formData.coverUrl': res.fileID,
            'formData.coverFileId': res.fileID
          })
        } else {
          const images = this.data.formData.images
          const imageFileIds = this.data.formData.imageFileIds
          images.push(res.fileID)
          imageFileIds.push(res.fileID)
          
          this.setData({
            'formData.images': images,
            'formData.imageFileIds': imageFileIds
          })
        }
        
        wx.showToast({ title: '上传成功', icon: 'success' })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传图片失败:', err)
      }
    })
  },

  onSaveWork: function () {
    const { 
      categoryId, categoryName, subcategoryId, subcategoryName,
      title, coverFileId, imageFileIds, usageType, description, order, isFeatured 
    } = this.data.formData
    
    if (!categoryId) {
      wx.showToast({ title: '请选择所属影集', icon: 'none' })
      return
    }
    
    if (!subcategoryId) {
      wx.showToast({ title: '请选择所属子类', icon: 'none' })
      return
    }
    
    if (!title) {
      wx.showToast({ title: '请输入作品标题', icon: 'none' })
      return
    }
    
    if (!coverFileId) {
      wx.showToast({ title: '请上传封面图片', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const db = wx.cloud.database()
    const data = {
      categoryId: categoryId,
      categoryName: categoryName,
      subcategoryId: subcategoryId,
      subcategoryName: subcategoryName,
      title: title,
      coverImage: coverFileId,
      images: imageFileIds,
      usageType: usageType,
      description: description,
      order: order,
      isFeatured: isFeatured,
      enabled: true
    }
    
    if (this.data.editMode) {
      db.collection('works').doc(this.data.editId).update({
        data: data
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.onCloseModal()
        this.loadWorks()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'error' })
        console.error('更新作品失败:', err)
      })
    } else {
      db.collection('works').add({
        data: data
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.onCloseModal()
        this.loadWorks()
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'error' })
        console.error('添加作品失败:', err)
      })
    }
  },

  onCloseModal: function () {
    this.setData({
      showModal: false,
      editMode: false,
      editId: null,
      formData: {
        categoryId: '',
        categoryName: '',
        categoryIndex: -1,
        subcategoryId: '',
        subcategoryName: '',
        subcategoryIndex: -1,
        title: '',
        coverUrl: '',
        coverFileId: '',
        images: [],
        imageFileIds: [],
        usageType: '',
        usageTypeIndex: -1,
        description: '',
        order: 1,
        isFeatured: false
      },
      currentSubcategoryNames: []
    })
  }
})
