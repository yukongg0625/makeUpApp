// pages/profile/profile.js
Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    userId: null,
    myFavorites: 0,
    tempAvatarUrl: '',
    tempNickname: ''
  },

  onLoad: function () {
    this.checkLoginStatus()
  },

  onShow: function () {
    this.checkLoginStatus()
    this.updateTabBar()
    if (this.data.isLoggedIn) {
      this.loadUserStats()
    }
  },

  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const db = wx.cloud.database()
      db.collection('settings').doc('customerAlbum').get()
        .then(res => {
          const albumName = (res.data && res.data.albumName) || '客照'
          const list = this.getTabBar().data.list
          list[1].text = albumName
          this.getTabBar().setData({
            selected: 3,
            albumName: albumName,
            list: list,
            middleTab: null
          })
        })
        .catch(() => {
          const list = this.getTabBar().data.list
          list[1].text = '客照'
          this.getTabBar().setData({
            selected: 3,
            albumName: '客照',
            list: list,
            middleTab: null
          })
        })
    }
  },

  checkLoginStatus: function () {
    const app = getApp()
    this.setData({
      isLoggedIn: !!app.globalData.userId,
      userInfo: app.globalData.userInfo || {},
      userId: app.globalData.userId
    })
  },

  loadUserStats: function () {
    const db = wx.cloud.database()
    const userId = this.data.userId

    db.collection('favorites').where({ userId: userId }).count().then(res => {
      this.setData({
        myFavorites: res.total || 0
      })
    }).catch(err => {
      console.error('加载用户统计失败:', err)
    })
  },

  onChooseAvatar: function(e) {
    const { avatarUrl } = e.detail
    this.setData({ tempAvatarUrl: avatarUrl })
  },

  onNicknameInput: function(e) {
    this.setData({ tempNickname: e.detail.value })
  },

  onLogin: function () {
    if (!this.data.tempAvatarUrl || !this.data.tempNickname) {
      wx.showToast({ title: '请先选择头像和昵称', icon: 'none' })
      return
    }

    const app = getApp()
    const userData = {
      nickName: this.data.tempNickname,
      avatarUrl: this.data.tempAvatarUrl
    }

    app.login(userData).then(() => {
      this.setData({ tempAvatarUrl: '', tempNickname: '' })
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
            myFavorites: 0
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

    if (type === 'favorites') {
      wx.navigateTo({ url: '/pages/profile/favorites/favorites' })
    }
  },

  onAboutTap: function() {
    wx.showModal({
      title: '关于我们',
      content: '潘潘的美妝穿搭合集\n展示美妝、造型、穿搭作品',
      showCancel: false
    })
  },

  onShareAppMessage() {
    return {
      title: '潘潘的美妝穿搭合集',
      path: '/pages/index/index'
    }
  }
})