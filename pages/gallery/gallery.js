const app = getApp()

Page({
  data: {
    works: [],
    categories: [],
    subcategories: [],
    currentCategory: null,
    currentSubcategory: null,
    loading: false,
    loadingMore: false,
    hasMore: true,
    skip: 0,
    limit: 20
  },

  onLoad: function (options) {
    this.loadCategories()
    this.loadSubcategories()
    
    if (options.category) {
      this.setData({
        currentCategory: parseInt(options.category)
      })
    }
    
    if (options.subcategory) {
      this.setData({
        currentSubcategory: parseInt(options.subcategory)
      })
    }
    
    this.loadWorks()
  },

  onShow: function () {
    this.loadCategories()
    this.loadSubcategories()
    this.setData({ skip: 0, hasMore: true })
    this.loadWorks()
  },

  loadCategories() {
    const categories = app.globalData.categories || []
    this.setData({ categories })
  },

  loadSubcategories() {
    const subcategories = app.globalData.subcategories || []
    this.setData({ subcategories })
  },

  loadWorks() {
    if (this.data.loading || this.data.loadingMore) return
    
    if (this.data.skip === 0) {
      this.setData({ loading: true })
    } else {
      this.setData({ loadingMore: true })
    }

    // 模拟数据，用于临时展示
    const mockWorks = [
      {
        _id: 'work1',
        title: '汉服 | 与诺',
        subtitle: '整体造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20hanfu%20dress%20elegant%20portrait%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 1,
        isFeatured: true
      },
      {
        _id: 'work2',
        title: '旗袍 | 雅韵',
        subtitle: '服装租赁',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20qipao%20dress%20traditional%20elegant%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 2,
        isFeatured: true
      },
      {
        _id: 'work3',
        title: '礼服 | 星辰',
        subtitle: '整体造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20evening%20gown%20formal%20dress%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 3,
        isFeatured: true
      },
      {
        _id: 'work4',
        title: '沙丽 | 流光',
        subtitle: '化妆造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indian%20sari%20traditional%20dress%20colorful%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 4,
        isFeatured: false
      },
      {
        _id: 'work5',
        title: '和服 | 花见',
        subtitle: '服装租赁',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20kimono%20traditional%20dress%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 5,
        isFeatured: false
      },
      {
        _id: 'work6',
        title: '汉服 | 清韵',
        subtitle: '整体造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20hanfu%20dress%20elegant%20portrait%20makeup%20styling&image_size=landscape_4_3',
        categoryId: 1,
        isFeatured: false
      }
    ]

    // 根据当前分类过滤数据
    let filteredWorks = mockWorks
    if (this.data.currentCategory) {
      filteredWorks = mockWorks.filter(work => work.categoryId === this.data.currentCategory)
    }

    this.setData({
      works: filteredWorks,
      hasMore: false,
      loading: false,
      loadingMore: false
    })
  },

  onCategoryFilter(e) {
    const categoryId = e.currentTarget.dataset.id
    const categoryName = e.currentTarget.dataset.name
    
    this.setData({
      currentCategory: categoryId || null,
      currentSubcategory: null,
      works: [],
      skip: 0,
      hasMore: true
    })
    
    this.loadWorks()
    
    if (categoryName) {
      wx.showToast({
        title: categoryName,
        icon: 'none',
        duration: 1000
      })
    }
  },

  onSubcategoryFilter(e) {
    const subcategoryId = e.currentTarget.dataset.id
    
    this.setData({
      currentSubcategory: subcategoryId || null,
      works: [],
      skip: 0,
      hasMore: true
    })
    
    this.loadWorks()
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadWorks()
    }
  },

  onPullDownRefresh() {
    this.setData({
      works: [],
      skip: 0,
      hasMore: true
    })
    this.loadWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})
