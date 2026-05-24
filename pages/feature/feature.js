// pages/feature/feature.js
const cloudStorage = require('../../utils/cloudStorage.js')
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
    const subcategoryId = options.subcategoryId || ''

    wx.setNavigationBarTitle({
      title: categoryName
    })

    this.setData({
      _categoryId: categoryId,
      _categoryName: categoryName,
      _subcategoryId: subcategoryId
    })

    this.reloadCategoryData(categoryId, categoryName, subcategoryId)
  },

  onShow: function () {
    if (this.data._categoryId) {
      this.reloadCategoryData(this.data._categoryId, this.data._categoryName, this.data._subcategoryId)
    }
  },

  reloadCategoryData: function (categoryId, categoryName, targetSubcategoryId) {
    const previouslySelectedSubcategoryId = targetSubcategoryId || (this.data.selectedSubcategory ? this.data.selectedSubcategory._id : null)

    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    console.log('reloadCategoryData - categoryId:', categoryId, 'previouslySelected:', previouslySelectedSubcategoryId)

    db.collection('subcategories')
      .where({
        categoryId: categoryId
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        console.log('数据库查询结果:', res.data)
        const allSubcategories = res.data
        const subcategories = allSubcategories.filter(sub => {
          const hidden = sub.hidden
          return hidden !== true && hidden !== 'true'
        })
        console.log('过滤后的子类:', subcategories)

        if (subcategories && subcategories.length > 0) {
          let selectedSubcategory = subcategories[0]

          if (previouslySelectedSubcategoryId) {
            const restored = subcategories.find(sub => String(sub._id) === String(previouslySelectedSubcategoryId))
            if (restored) {
              selectedSubcategory = restored
              console.log('恢复之前选择的子类:', restored.name)
            }
          }

          this.setData({
            subcategories: subcategories,
            selectedSubcategory: selectedSubcategory,
            category: { name: categoryName }
          })

          this.loadWorks(categoryId, selectedSubcategory._id)
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
    return [{
      _id: 'all',
      name: categoryName,
      categoryId: categoryId,
      order: 0
    }]
  },

  loadWorks: function (categoryId, subcategoryId) {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    const whereCondition = {
      categoryId: categoryId,
      enabled: true
    }

    if (subcategoryId !== 'all') {
      whereCondition.subcategoryId = subcategoryId
    }

    db.collection('works')
      .where(whereCondition)
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        // 过滤隐藏作品
        const works = res.data
          .filter(w => {
            const hidden = w.hidden
            return hidden !== true && hidden !== 'true'
          })
          .map(item => ({
            ...item,
            coverUrl: item.coverImage || ''
          }))

        this.convertCloudStorageUrls(works, 'coverUrl').then(convertedWorks => {
          const validWorks = convertedWorks.filter(work => work.coverUrl && work.coverUrl.length > 0)
          this.setData({
            works: validWorks,
            loading: false
          })
        }).catch(err => {
          console.error('转换封面URL失败:', err)
          this.setData({
            works: [],
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
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  onSubcategoryTap: function (e) {
    const subcategoryId = e.currentTarget.dataset.id
    const selectedSubcategory = this.data.subcategories.find(sub => sub._id === subcategoryId)

    this.setData({
      selectedSubcategory: selectedSubcategory
    })

    this.loadWorks(this.data._categoryId, subcategoryId)
  },

  onWorkTap: function (e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + workId
    })
  }
})