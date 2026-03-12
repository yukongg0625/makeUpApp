Page({
  data: {
    featuredWorks: [],
    loading: false,
    hasMore: true,
    skip: 0,
    limit: 20
  },

  onLoad: function () {
    this.loadFeaturedWorks()
  },

  loadFeaturedWorks() {
    if (this.data.loading) return

    if (this.data.skip === 0) {
      this.setData({ loading: true })
    }

    // 模拟数据，用于临时展示
    const mockFeaturedWorks = [
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
      }
    ]

    this.setData({
      featuredWorks: mockFeaturedWorks,
      hasMore: false,
      loading: false
    })
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
  }
})
