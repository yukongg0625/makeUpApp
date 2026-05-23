// pages/admin/works/works.js
const cloudStorage = require('../../../utils/cloudStorage.js')
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
    loading: true,
    showModal: false,
    editMode: false,
    editId: null,
    showSubcategoryPicker: false,
    hasChanges: false,
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
      description: '',
      order: 1,
      isFeatured: false,
      hidden: false
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
    
    return query.orderBy('order', 'asc')
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
    
    return wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getTempFileURL',
        fileList: fileIds
      }
    }).then(res => {
      const urlMap = res.result.urlMap || {}
      
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

  // 转换图片 File ID 数组为临时 URL
  convertImageFileIdsToUrls: function(fileIds) {
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
      
      return fileIds.map(fileId => {
        if (fileId && fileId.startsWith('cloud://')) {
          return urlMap[fileId] || fileId
        }
        return fileId
      })
    }).catch(err => {
      console.error('转换图片 URL 失败:', err)
      return fileIds
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
    
    return wx.cloud.callFunction({
      name: 'getImageUrl',
      data: {
        action: 'getTempFileURL',
        fileList: allFileIds
      }
    }).then(res => {
      const urlMap = res.result.urlMap || {}
      
      return works.map(work => {
        if (work.images && Array.isArray(work.images)) {
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
      this.loadSubcategories().then(() => {
        this.loadWorks()
      })
    } else {
      const category = this.data.categories[index]
      this.setData({
        selectedCategoryIndex: index,
        selectedCategoryName: category.name,
        selectedSubcategoryIndex: -1,
        selectedSubcategoryName: '全部子类'
      })
      this.loadSubcategories(category._id).then(() => {
        this.loadWorks(category._id)
      })
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

  onWorkTap: function (e) {
    const id = e.currentTarget.dataset.id
    this.onEditWork({ currentTarget: { dataset: { id: id } } })
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
        description: '',
        order: 1,
        isFeatured: false
      },
      currentSubcategoryNames: currentSubcategoryNames,
      _currentSubcategories: currentSubcategories,
      hasChanges: false
    })
    
    if (selectedSubcategoryId) {
      const db = wx.cloud.database()
      db.collection('works')
        .where({ subcategoryId: selectedSubcategoryId })
        .orderBy('order', 'desc')
        .limit(1)
        .get()
        .then(res => {
          let nextOrder = 1
          if (res.data && res.data.length > 0 && res.data[0].order) {
            nextOrder = res.data[0].order + 1
          }
          
          this.setData({
            'formData.order': nextOrder
          })
        })
        .catch(err => {
          console.error('获取最大order失败:', err)
        })
    }
  },

  onEditWork: function (e) {
    const id = e.currentTarget.dataset.id
    console.log('编辑作品 ID:', id)
    console.log('当前作品列表:', this.data.works.map(w => ({ _id: w._id, title: w.title })))
    
    const work = this.data.works.find(item => String(item._id) === String(id))
    
    if (!work) {
      console.error('未找到作品:', id)
      wx.showToast({ title: '作品不存在', icon: 'none' })
      return
    }
    
    console.log('找到作品:', work)
    
    let categoryIndex = this.data.categories.findIndex(
      cat => String(cat._id) === String(work.categoryId)
    )
    
    let subcategoryIndex = this.data.subcategories.findIndex(
      sub => String(sub._id) === String(work.subcategoryId)
    )
    
    let currentSubcategories = this.data.subcategories.filter(
      sub => String(sub.categoryId) === String(work.categoryId)
    )
    
    if (currentSubcategories.length === 0) {
      currentSubcategories = [{ _id: work.subcategoryId, name: work.subcategoryName, categoryId: work.categoryId }]
      subcategoryIndex = 0
    }
    
    const originalCoverFileId = work._originalCoverImage || work.coverImage || ''
    const originalImageFileIds = work._originalImages || work.images || []
    
    console.log('原始图片 IDs:', originalImageFileIds)
    
    this.convertImageFileIdsToUrls(originalImageFileIds).then(displayImages => {
      console.log('转换后的图片 URLs:', displayImages)
      
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
          images: displayImages,
          imageFileIds: originalImageFileIds,
          usageType: work.usageType,
          description: work.description || '',
          order: work.order,
          isFeatured: work.isFeatured || false,
          hidden: work.hidden || false
        },
        currentSubcategoryNames: currentSubcategories.map(sub => sub.name),
        _currentSubcategories: currentSubcategories
      }, () => {
        console.log('弹窗已打开, showModal:', this.data.showModal)
      })
    }).catch(err => {
      console.error('编辑作品失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onDeleteWorkFromModal: function () {
    if (!this.data.editId) {
      wx.showToast({ title: '请先保存作品', icon: 'none' })
      return
    }
    
    const workId = this.data.editId
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          this.onCloseModal()
          this.deleteWork(workId)
        }
      }
    })
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
    console.log('删除作品 ID:', id)
    
    wx.showLoading({ title: '删除中...' })
    
    wx.cloud.callFunction({
      name: 'deleteDocument',
      data: {
        collection: 'works',
        id: id
      }
    }).then(res => {
      console.log('删除结果:', res)
      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadCurrentFilteredWorks()
      } else {
        const errorMsg = res.result ? res.result.message : '未知错误'
        console.error('删除失败详情:', res)
        wx.showToast({ title: '删除失败: ' + errorMsg, icon: 'none', duration: 3000 })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('删除作品失败:', err)
      wx.showToast({ title: '删除失败: ' + (err.message || '未知错误'), icon: 'none', duration: 3000 })
    })
  },

  onFormCategoryChange: function (e) {
    const index = parseInt(e.detail.value)
    const category = this.data.categories[index]
    
    const currentSubcategories = this.data.subcategories.filter(
      sub => String(sub.categoryId) === String(category._id)
    )
    const currentSubcategoryNames = currentSubcategories.map(sub => sub.name)
    
    this.setData({
      'formData.categoryId': category._id,
      'formData.categoryName': category.name,
      'formData.categoryIndex': index,
      'formData.subcategoryId': '',
      'formData.subcategoryName': '',
      'formData.subcategoryIndex': -1,
      currentSubcategoryNames: currentSubcategoryNames,
      _currentSubcategories: currentSubcategories,
      showSubcategoryPicker: currentSubcategories.length > 0,
      hasChanges: true
    })
    
    this.setData({ 'formData.order': 1 })
  },

  onFormSubcategoryChange: function (e) {
    const index = parseInt(e.detail.value)
    const currentSubcategories = this.data._currentSubcategories || []
    
    if (index < 0 || index >= currentSubcategories.length) {
      return
    }
    
    const subcategory = currentSubcategories[index]
    
    this.setData({
      'formData.subcategoryId': subcategory._id,
      'formData.subcategoryName': subcategory.name,
      'formData.subcategoryIndex': index,
      hasChanges: true
    })
    
    const db = wx.cloud.database()
    db.collection('works')
      .where({ subcategoryId: subcategory._id })
      .orderBy('order', 'desc')
      .limit(1)
      .get()
      .then(res => {
        let nextOrder = 1
        if (res.data && res.data.length > 0 && res.data[0].order) {
          nextOrder = res.data[0].order + 1
        }
        this.setData({ 'formData.order': nextOrder })
      })
      .catch(err => {
        console.error('获取最大order失败:', err)
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
    
    if (!this.data.editMode) {
      const db = wx.cloud.database()
      db.collection('works')
        .where({ subcategoryId: subcategory._id })
        .orderBy('order', 'desc')
        .limit(1)
        .get()
        .then(res => {
          let nextOrder = 1
          if (res.data && res.data.length > 0 && res.data[0].order) {
            nextOrder = res.data[0].order + 1
          }
          
          this.setData({
            'formData.order': nextOrder
          })
        })
        .catch(err => {
          console.error('获取最大order失败:', err)
        })
    }
  },

  onTitleInput: function (e) {
    this.setData({
      'formData.title': e.detail.value,
      hasChanges: true
    })
  },

  onDescriptionInput: function (e) {
    this.setData({
      'formData.description': e.detail.value,
      hasChanges: true
    })
  },

  onOrderInput: function (e) {
    const value = e.detail.value
    this.setData({
      'formData.order': value === '' ? '' : (parseInt(value) || 1),
      hasChanges: true
    })
  },

  onUsageTypeInput: function (e) {
    this.setData({
      'formData.usageType': e.detail.value,
      hasChanges: true
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
    
    const isDeletingCover = index === 0
    
    images.splice(index, 1)
    imageFileIds.splice(index, 1)
    
    if (isDeletingCover && imageFileIds.length > 0) {
      wx.showToast({ title: '已自动将下一张图片设为封面', icon: 'none' })
    }
    
    this.setData({
      'formData.images': images,
      'formData.imageFileIds': imageFileIds,
      hasChanges: true
    })
  },

  onImageTap: function (e) {
    const index = e.currentTarget.dataset.index
    
    if (index === 0) {
      wx.showToast({ title: '已是封面图片', icon: 'none' })
      return
    }
    
    const images = this.data.formData.images
    const imageFileIds = this.data.formData.imageFileIds
    
    const clickedImage = images.splice(index, 1)[0]
    const clickedFileId = imageFileIds.splice(index, 1)[0]
    
    images.unshift(clickedImage)
    imageFileIds.unshift(clickedFileId)
    
    this.setData({
      'formData.images': images,
      'formData.imageFileIds': imageFileIds,
      'formData.coverFileId': imageFileIds[0],
      hasChanges: true
    })
    
    wx.showToast({ title: '已设为封面', icon: 'success' })
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
            'formData.coverFileId': res.fileID,
            hasChanges: true
          })
        } else {
          const images = this.data.formData.images
          const imageFileIds = this.data.formData.imageFileIds
          
          imageFileIds.push(res.fileID)
          
          cloudStorage.getTempFileURL([res.fileID]).then(urlMap => {
            const tempUrl = urlMap[res.fileID] || res.fileID
            images.push(tempUrl)
            
            this.setData({
              'formData.images': images,
              'formData.imageFileIds': imageFileIds,
              hasChanges: true
            })
            
            wx.showToast({ title: '上传成功', icon: 'success' })
          }).catch(err => {
            console.error('获取临时URL失败:', err)
            images.push(res.fileID)
            
            this.setData({
              'formData.images': images,
              'formData.imageFileIds': imageFileIds,
              hasChanges: true
            })
            
            wx.showToast({ title: '上传成功', icon: 'success' })
          })
          return
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
    if (!this.data.hasChanges) {
      wx.showToast({ title: '没有修改内容', icon: 'none' })
      return
    }
    
    const { 
      categoryId, categoryName, subcategoryId, subcategoryName,
      title, coverFileId, imageFileIds, usageType, description, order, isFeatured, hidden 
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
    
    if (imageFileIds.length === 0) {
      wx.showToast({ title: '请上传作品图片', icon: 'none' })
      return
    }
    
    if (!order || order < 1) {
      wx.showToast({ title: '请输入有效的排序号', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const db = wx.cloud.database()
    
    const finalCoverFileId = coverFileId || imageFileIds[0]
    
    const data = {
      categoryId: categoryId,
      categoryName: categoryName,
      subcategoryId: subcategoryId,
      subcategoryName: subcategoryName,
      title: title,
      coverImage: finalCoverFileId,
      images: imageFileIds,
      usageType: usageType,
      description: description,
      order: order,
      isFeatured: isFeatured,
      hidden: hidden || false,
      enabled: true
    }
    
    if (this.data.editMode) {
      // 获取原来的 isFeatured 状态
      const oldWork = this.data.works.find(w => w._id === this.data.editId)
      const oldIsFeatured = oldWork ? (oldWork.isFeatured || false) : false
      
      db.collection('works').doc(this.data.editId).update({
        data: data
      }).then(() => {
        // 同步 featured 集合
        if (isFeatured && !oldIsFeatured) {
          // 新加入精华
          this.addFeaturedRecord(data)
        } else if (!isFeatured && oldIsFeatured) {
          // 移出精华
          this.removeFeaturedRecord(this.data.editId)
        } else {
          wx.hideLoading()
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.onCloseModal()
          this.loadCurrentFilteredWorks()
        }
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'error' })
        console.error('更新作品失败:', err)
      })
    } else {
      db.collection('works').add({
        data: data
      }).then(res => {
        wx.hideLoading()
        wx.showToast({ title: '添加成功', icon: 'success' })
        
        // 如果是精华作品，同步添加到 featured 集合
        if (isFeatured) {
          data._id = res._id
          this.addFeaturedRecord(data)
        }
        
        const categoryIndex = this.data.categories.findIndex(
          cat => String(cat._id) === String(categoryId)
        )
        
        this.setData({
          selectedCategoryIndex: categoryIndex,
          selectedCategoryName: categoryName,
          selectedSubcategoryIndex: -1,
          selectedSubcategoryName: '全部子类'
        })
        
        this.onCloseModal()
        
        this.loadSubcategories(categoryId).then(() => {
          this.loadWorks(categoryId)
        })
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '添加失败', icon: 'error' })
        console.error('添加作品失败:', err)
      })
    }
  },

  // 添加精华记录
  addFeaturedRecord: function(workData) {
    const db = wx.cloud.database()
    const featuredData = {
      workId: workData._id || this.data.editId,
      title: workData.title,
      categoryId: workData.categoryId,
      categoryName: workData.categoryName,
      subcategoryId: workData.subcategoryId,
      subcategoryName: workData.subcategoryName,
      coverImage: workData.coverImage,
      images: workData.images,
      usageType: workData.usageType,
      description: workData.description,
      order: workData.order
    }
    
    db.collection('featured').add({
      data: featuredData
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.onCloseModal()
      this.loadCurrentFilteredWorks()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功，但同步精华失败', icon: 'none' })
      console.error('同步精华记录失败:', err)
      this.onCloseModal()
      this.loadCurrentFilteredWorks()
    })
  },

  // 移除精华记录
  removeFeaturedRecord: function(workId) {
    const db = wx.cloud.database()
    db.collection('featured').where({ workId: workId }).get().then(res => {
      if (res.data.length > 0) {
        const featuredId = res.data[0]._id
        wx.cloud.callFunction({
          name: 'deleteDocument',
          data: {
            collection: 'featured',
            id: featuredId
          }
        }).then(() => {
          wx.hideLoading()
          wx.showToast({ title: '保存成功', icon: 'success' })
          this.onCloseModal()
          this.loadCurrentFilteredWorks()
        }).catch(err => {
          wx.hideLoading()
          wx.showToast({ title: '保存成功，但同步精华失败', icon: 'none' })
          console.error('删除精华记录失败:', err)
          this.onCloseModal()
          this.loadCurrentFilteredWorks()
        })
      } else {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.onCloseModal()
        this.loadCurrentFilteredWorks()
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.onCloseModal()
      this.loadCurrentFilteredWorks()
    })
  },

  loadCurrentFilteredWorks: function () {
    const categoryId = this.data.selectedCategoryIndex === -1 ? null : this.data.categories[this.data.selectedCategoryIndex]._id
    const subcategoryId = this.data.selectedSubcategoryIndex === -1 ? null : this.data.subcategories[this.data.selectedSubcategoryIndex]._id
    
    const loadSubcategoriesPromise = new Promise((resolve) => {
      if (categoryId) {
        this.loadSubcategories(categoryId)
        setTimeout(resolve, 500)
      } else {
        this.loadSubcategories()
        setTimeout(resolve, 500)
      }
    })
    
    loadSubcategoriesPromise.then(() => {
      this.loadWorks(categoryId, subcategoryId)
    })
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
        description: '',
        order: 1,
        isFeatured: false,
        hidden: false
      },
      currentSubcategoryNames: []
    })
  },

  onToggleHiddenInForm: function () {
    const currentValue = this.data.formData.hidden
    this.setData({
      'formData.hidden': !currentValue,
      hasChanges: true
    })
  },

  onToggleFeaturedInForm: function () {
    const currentValue = this.data.formData.isFeatured
    this.setData({
      'formData.isFeatured': !currentValue,
      hasChanges: true
    })
  },
})
