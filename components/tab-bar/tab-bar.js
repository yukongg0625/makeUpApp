Component({
  properties: {
    currentTab: {
      type: Number,
      value: 0
    }
  },
  data: {
    iconPaths: [
      '/images/home.png',
      '/images/star.png',
      '/images/calendar.png'
    ],
    selectedIconPaths: [
      '/images/home-active.png',
      '/images/star-active.png',
      '/images/calendar-active.png'
    ]
  },
  methods: {
    onTabTap(e) {
      const index = e.currentTarget.dataset.index
      const pages = [
        '/pages/index/index',
        '/pages/featured/featured',
        '/pages/contact/contact'
      ]
      wx.switchTab({
        url: pages[index]
      })
    }
  }
})
