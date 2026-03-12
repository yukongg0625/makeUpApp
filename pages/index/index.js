const app = getApp()

Page({
  data: {
    categories: [],
    styleWorks: [],
    loading: false
  },

  onLoad: function () {
    this.loadCategories()
    this.loadStyleWorks()
  },

  loadCategories() {
    const categories = app.globalData.categories || []
    this.setData({ categories })
  },

  loadStyleWorks() {
    this.setData({ loading: true })
    
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
    
    this.setData({
      styleWorks: mockWorks,
      loading: false
    })
  },

  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id
    const categoryName = e.currentTarget.dataset.name
    
    wx.navigateTo({
      url: `/pages/gallery/gallery?category=${categoryId}`
    })
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onViewAllStyles() {
    wx.navigateTo({
      url: '/pages/gallery/gallery'
    })
  },

  onFollow(e) {
    const workId = e.currentTarget.dataset.id
    wx.showToast({
      title: '已关注',
      icon: 'success'
    })
  },

  onQuickBook(e) {
    const workId = e.currentTarget.dataset.id
    
    wx.cloud.database()
      .collection('works')
      .doc(workId)
      .get()
      .then(res => {
        const work = res.data
        wx.navigateTo({
          url: `/pages/booking/booking?workId=${workId}&workTitle=${encodeURIComponent(work.title)}`
        })
      })
      .catch(err => {
        console.error('获取作品信息失败:', err)
        wx.navigateTo({
          url: `/pages/booking/booking?workId=${workId}`
        })
      })
  },

  onPullDownRefresh() {
    this.loadStyleWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})
