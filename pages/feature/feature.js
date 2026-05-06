// pages/feature/feature.js
Page({
  data: {
    category: {},
    subcategories: [],
    works: [],
    selectedSubcategory: null,
    loading: true
  },

  onLoad: function (options) {
    const categoryId = options.id
    const categoryName = options.name ? decodeURIComponent(options.name) : '影集'
    
    wx.setNavigationBarTitle({
      title: categoryName
    })
    
    this.setData({
      _categoryId: categoryId,
      _categoryName: categoryName
    })
    
    this.loadCategoryData(categoryId, categoryName)
  },

  onShow: function () {
    if (this.data._categoryId) {
      this.loadCategoryData(this.data._categoryId, this.data._categoryName)
    }
  },

  loadCategoryData: function (categoryId, categoryName) {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    
    console.log('loadCategoryData - categoryId:', categoryId)
    
    db.collection('subcategories')
      .where({ categoryId: categoryId })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        console.log('数据库查询结果:', res.data)
        const subcategories = res.data
        
        if (subcategories && subcategories.length > 0) {
          this.setData({
            subcategories: subcategories,
            selectedSubcategory: subcategories[0],
            category: { name: categoryName }
          })
          
          this.loadWorks(categoryId, subcategories[0]._id)
        } else {
          console.warn('subcategories 集合为空，使用降级数据')
          const fallbackSubcategories = this.getFallbackSubcategories(categoryId, categoryName)
          this.setData({
            subcategories: fallbackSubcategories,
            selectedSubcategory: fallbackSubcategories[0],
            category: { name: categoryName }
          })
          
          this.loadWorks(categoryId, fallbackSubcategories[0]._id)
        }
      })
      .catch(err => {
        console.error('加载子类失败:', err)
        console.warn('使用降级数据')
        const fallbackSubcategories = this.getFallbackSubcategories(categoryId, categoryName)
        this.setData({
          subcategories: fallbackSubcategories,
          selectedSubcategory: fallbackSubcategories[0],
          category: { name: categoryName }
        })
        
        this.loadWorks(categoryId, fallbackSubcategories[0]._id)
      })
  },

  getFallbackSubcategories: function (categoryId, categoryName) {
    return []
  },

  loadWorks: function (categoryId, subcategoryId) {
    this.setData({ loading: true })
    
    const db = wx.cloud.database()
    
    db.collection('works')
      .where({ 
        categoryId: categoryId, 
        subcategoryId: subcategoryId, 
        enabled: true 
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const works = res.data.map(item => ({
          ...item,
          coverUrl: item.coverImage || ''
        }))
        
        // 转换云存储 File ID 为临时 URL
        this.convertCloudStorageUrls(works, 'coverUrl').then(convertedWorks => {
          this.setData({
            works: convertedWorks,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载作品失败:', err)
        this.setData({
          works: [],
          loading: false
        })
      })
  },

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

  onSubcategoryTap: function (e) {
    const subcategoryId = e.currentTarget.dataset.id
    const selectedSubcategory = this.data.subcategories.find(sub => sub._id === subcategoryId)
    
    this.setData({
      selectedSubcategory: selectedSubcategory
    })
    
    // 加载对应子类的作品
    this.loadWorks(this.data.category._id, subcategoryId)
  },

  onWorkTap: function (e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + workId
    })
  }
})
