Component({
  data: {
    selected: 0,
    albumName: '美丽瞬间',
    middleTab: null,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "主页",
        iconPath: "/images/home.png",
        selectedIconPath: "/images/home-active.png"
      },
      {
        pagePath: "/pages/customer/customer",
        text: "美丽瞬间",
        iconPath: "/images/star.png",
        selectedIconPath: "/images/star-active.png"
      },
      {
        pagePath: "/pages/contact/contact",
        text: "联系我们",
        iconPath: "/images/calendar.png",
        selectedIconPath: "/images/calendar-active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/images/profile.png",
        selectedIconPath: "/images/profile-active.png"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const url = this.data.list[index].pagePath
      wx.switchTab({ url })
    },
    onMiddleTabTap() {
      if (this.data.middleTab && this.data.middleTab.url) {
        wx.navigateTo({ url: this.data.middleTab.url })
      } else {
        wx.switchTab({ url: '/pages/customer/customer' })
      }
    }
  }
})