const app = getApp()
const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    features: [],
    featuredWorks: [],
    loading: false
  },

  onLoad: function () {
    this.loadFeatures()
    this.loadFeaturedWorks()
  },

  onShow: function () {
    this.loadFeatures()
    this.loadFeaturedWorks()
    this.updateTabBar()
  },

  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const db = wx.cloud.database()
      db.collection('settings').doc('customerAlbum').get()
        .then(res => {
          if (res.data && res.data.albumName) {
            this.getTabBar().setData({
              selected: 0,
              albumName: res.data.albumName,
              middleTab: null
            })
          } else {
            this.getTabBar().setData({ selected: 0, middleTab: null })
          }
        })
        .catch(() => {
          this.getTabBar().setData({ selected: 0, middleTab: null })
        })
    }
  },

  loadFeatures() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    db.collection('categories')
      .where({
        enabled: true
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const allFeatures = res.data
          const features = allFeatures.filter(item => {
            const hidden = item.hidden
            return hidden !== true && hidden !== 'true'
          })
          console.log('过滤后的影集:', features)
          
          if (features.length > 0) {
            this.convertCloudStorageUrls(features, 'coverImage')
              .then(convertedFeatures => {
                this.setData({
                  features: convertedFeatures,
                  loading: false
                })
              })
              .catch(err => {
                console.error('转换图片 URL 失败:', err)
                this.setData({
                  features: features,
                  loading: false
                })
              })
          } else {
            this.setData({
              features: [],
              loading: false
            })
          }
        } else {
          console.warn('categories 集合为空，使用降级数据')
          this.setData({
            features: this.getFallbackFeatures(),
            loading: false
          })
        }
      })
      .catch(err => {
        console.error('加载影集失败:', err)
        console.warn('使用降级数据')
        this.setData({
          features: this.getFallbackFeatures(),
          loading: false
        })
      })
  },

  convertCloudStorageUrls(data, fieldName) {
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  getFallbackFeatures() {
    return [
      { _id: '1', name: '化妆造型', coverImage: '', order: 1, enabled: true },
      { _id: '2', name: '整体造型', coverImage: '', order: 2, enabled: true },
      { _id: '3', name: '服装租赁', coverImage: '', order: 3, enabled: true },
      { _id: '4', name: '饰品租赁', coverImage: '', order: 4, enabled: true },
      { _id: '5', name: '美妆私教', coverImage: '', order: 5, enabled: true }
    ]
  },

  loadFeaturedWorks() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('featured')
      .where({ _id: _.exists(true) })
      .orderBy('order', 'asc')
      .limit(10)
      .get()
      .then(res => {
        const featured = res.data
        
        if (featured.length === 0) {
          this.setData({
            featuredWorks: [],
            loading: false
          })
          return
        }
        
        const workIds = featured.map(item => item.workId).filter(id => id)
        
        if (workIds.length === 0) {
          this.setData({
            featuredWorks: [],
            loading: false
          })
          return
        }
        
        // 获取隐藏的影集和子类ID
        Promise.all([
          db.collection('categories').where({ hidden: true }).get(),
          db.collection('subcategories').where({ hidden: true }).get()
        ]).then(([categoriesRes, subcategoriesRes]) => {
          const hiddenCategoryIds = categoriesRes.data.map(c => c._id)
          const hiddenSubcategoryIds = subcategoriesRes.data.map(s => s._id)
          
          let conditions = {
            _id: _.in(workIds),
            enabled: true,
            hidden: _.neq(true)
          }
          
          if (hiddenCategoryIds.length > 0) {
            conditions.categoryId = _.nin(hiddenCategoryIds)
          }
          
          db.collection('works')
            .where(conditions)
            .get()
            .then(worksRes => {
              let works = worksRes.data
              
              // 过滤隐藏子类下的作品
              if (hiddenSubcategoryIds.length > 0) {
                works = works.filter(w => !hiddenSubcategoryIds.includes(w.subcategoryId))
              }
              
              const worksMap = {}
              works.forEach(work => {
                worksMap[work._id] = work
              })
              
              const featuredWorks = featured
                .filter(item => worksMap[item.workId])
                .map(item => {
                  const work = worksMap[item.workId]
                  const coverImage = work ? work.coverImage : item.coverImage
                  return {
                    ...item,
                    coverUrl: coverImage || ''
                  }
                })
              
              this.convertCloudStorageUrls(featuredWorks, 'coverUrl')
                .then(featuredWorks => {
                  this.setData({
                    featuredWorks: featuredWorks,
                    loading: false
                  })
                })
                .catch(err => {
                  console.error('转换图片 URL 失败:', err)
                  this.setData({
                    featuredWorks: featuredWorks,
                    loading: false
                  })
                })
            })
            .catch(err => {
              console.error('查询作品信息失败:', err)
              this.setData({
                featuredWorks: [],
                loading: false
              })
            })
        }).catch(err => {
          console.error('获取隐藏分类失败:', err)
          this.setData({ loading: false })
        })
      })
      .catch(err => {
        console.error('加载精华相册失败:', err)
        this.setData({ loading: false })
      })
  },

  onFeatureTap(e) {
    const featureId = e.currentTarget.dataset.id
    const featureName = e.currentTarget.dataset.name

    wx.navigateTo({
      url: `/pages/feature/feature?id=${featureId}&name=${encodeURIComponent(featureName)}`
    })
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onViewFeatured() {
    wx.navigateTo({
      url: '/pages/featured/featured'
    })
  },

  onPullDownRefresh() {
    this.loadFeatures()
    this.loadFeaturedWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})