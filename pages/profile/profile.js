// pages/profile/profile.js
Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    userId: null,
    myLikes: 0,
    myComments: 0
  },

  onLoad: function () {
    this.checkLoginStatus()
  },

  onShow: function () {
    this.checkLoginStatus()
    if (this.data.isLoggedIn) {
      this.loadUserStats()
    }
  },

  checkLoginStatus: function () {
    const app = getApp()
    this.setData({
      isLoggedIn: !!app.globalData.userId,
      userInfo: app.globalData.userInfo,
      userId: app.globalData.userId
    })
  },

  loadUserStats: function () {
    const db = wx.cloud.database()
    const userId = this.data.userId

    Promise.all([
      db.collection('likes').where({ userId: userId }).count(),
      db.collection('comments').where({ userId: userId }).count()
    ]).then(([likesRes, commentsRes]) => {
      this.setData({
        myLikes: likesRes.total || 0,
        myComments: commentsRes.total || 0
      })
    }).catch(err => {
      console.error('加载用户统计失败:', err)
    })
  },

  onLogin: function () {
    const app = getApp()
    app.login().then(() => {
      this.checkLoginStatus()
      this.loadUserStats()
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败', icon: 'error' })
    })
  },

  onLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.globalData.userId = null
          app.globalData.userInfo = null
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            userId: null,
            myLikes: 0,
            myComments: 0
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  },

  onMenuTap: function (e) {
    const type = e.currentTarget.dataset.type
    const app = getApp()

    if (!app.globalData.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    switch (type) {
      case 'likes':
        wx.navigateTo({ url: '/pages/profile/likes/likes' })
        break
      case 'comments':
        wx.navigateTo({ url: '/pages/profile/comments/comments' })
        break
      default:
        break
    }
  },

  onShareAppMessage() {
    return {
      title: '潘潘的美妝穿搭合集',
      path: '/pages/index/index'
    }
  }
})