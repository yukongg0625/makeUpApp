const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    featuredWorks: [],
    featuredRows: [],
    loading: false,
    hasMore: true,
    skip: 0,
    limit: 20,
    albumName: '美丽瞬间'
  },

  onLoad: function () {
    this.loadAlbumName()
    this.loadFeaturedWorks()
  },

  onShow: function () {
    this.setData({
      featuredWorks: [],
      skip: 0,
      hasMore: true
    })
    this.loadAlbumName()
    this.loadFeaturedWorks()
  },

  loadAlbumName() {
    const db = wx.cloud.database()
    db.collection('settings').doc('customerAlbum').get()
      .then(res => {
        if (res.data && res.data.albumName) {
          this.setData({ albumName: res.data.albumName })
        }
      })
      .catch(() => {})
  },

  loadFeaturedWorks() {
    if (this.data.loading) return

    if (this.data.skip === 0) {
      this.setData({ loading: true })
    }

    const db = wx.cloud.database()
    const _ = db.command

    // 先获取隐藏的影集和子类ID
    Promise.all([
      db.collection('categories').where({ hidden: true }).get(),
      db.collection('subcategories').where({ hidden: true }).get()
    ]).then(([categoriesRes, subcategoriesRes]) => {
      const hiddenCategoryIds = categoriesRes.data.map(c => c._id)
      const hiddenSubcategoryIds = subcategoriesRes.data.map(s => s._id)

      let query = db.collection('works')
        .where({
          isFeatured: true,
          enabled: true,
          hidden: _.neq(true)
        })

      // 排除隐藏影集下的作品
      if (hiddenCategoryIds.length > 0) {
        query = db.collection('works').where(
          _.and([
            { isFeatured: true, enabled: true, hidden: _.neq(true) },
            { categoryId: _.nin(hiddenCategoryIds) }
          ])
        )
      }

      query.orderBy('order', 'asc')
        .skip(this.data.skip)
        .limit(this.data.limit)
        .get()
        .then(res => {
          // 再过滤隐藏子类下的作品
          let works = res.data
          if (hiddenSubcategoryIds.length > 0) {
            works = works.filter(w => !hiddenSubcategoryIds.includes(w.subcategoryId))
          }

          const mappedWorks = works.map(item => ({
            ...item,
            id: item._id,
            coverUrl: item.coverImage || ''
          }))
          
          // 转换云存储 File ID 为临时 URL
          this.convertCloudStorageUrls(mappedWorks, 'coverUrl').then(convertedWorks => {
            const rows = []
            for (let i = 0; i < convertedWorks.length; i += 2) {
              rows.push(convertedWorks.slice(i, i + 2))
            }
            this.setData({
              featuredWorks: this.data.skip === 0 ? convertedWorks : [...this.data.featuredWorks, ...convertedWorks],
              featuredRows: rows,
              hasMore: convertedWorks.length >= this.data.limit,
              loading: false,
              skip: this.data.skip + convertedWorks.length
            })
          })
        })
        .catch(err => {
          console.error('加载精华相册失败:', err)
          this.setData({ loading: false })
        })
    }).catch(err => {
      console.error('获取隐藏分类失败:', err)
      this.setData({ loading: false })
    })
  },

  // 转换云存储 File ID 为临时 URL
  convertCloudStorageUrls: function(data, fieldName) {
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFeaturedWorks()
    }
  },

  onPullDownRefresh() {
    this.setData({
      featuredWorks: [],
      skip: 0,
      hasMore: true
    })
    this.loadFeaturedWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  switchTab(e) {
    const page = e.currentTarget.dataset.page
    wx.switchTab({ url: page })
  },

  onBack() {
    wx.navigateBack()
  }
})
