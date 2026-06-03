const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    contactInfo: {
      name: '',
      description: '',
      qrcodeUrl: ''
    },
    isAdmin: false,
    openId: '',
    loading: true
  },

  onLoad: function () {
    this.checkAdminStatus()
    this.loadContactInfo()
  },

  onShow: function () {
    wx.showShareMenu({
      withShareTicket: false,
      menus: ['shareAppMessage'],
      fail: (err) => console.warn('开启分享菜单失败:', err)
    })
    this.checkAdminStatus()
    this.loadContactInfo()
    this.updateTabBar()
  },

  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const db = wx.cloud.database()
      db.collection('settings').doc('customerAlbum').get()
        .then(res => {
          if (res.data && res.data.albumName) {
            this.getTabBar().setData({
              selected: 2,
              albumName: res.data.albumName
            })
          } else {
            this.getTabBar().setData({ selected: 2 })
          }
        })
        .catch(() => {
          this.getTabBar().setData({ selected: 2 })
        })
    }
  },

  checkAdminStatus: function () {
    const app = getApp()

    if (app.globalData.currentOpenId) {
      this.setData({
        isAdmin: app.globalData.isAdmin,
        openId: app.globalData.currentOpenId
      })
      console.log('管理员状态（已加载）:', this.data.isAdmin)
    } else {
      setTimeout(() => {
        this.setData({
          isAdmin: app.globalData.isAdmin,
          openId: app.globalData.currentOpenId
        })
        console.log('管理员状态（延迟检查）:', this.data.isAdmin)
      }, 500)
    }
  },

  onAdminStatusUpdate: function (isAdmin) {
    const app = getApp()
    this.setData({
      isAdmin: isAdmin,
      openId: app.globalData.currentOpenId
    })
    console.log('管理员状态已更新:', isAdmin)
  },

  loadContactInfo: function () {
    const db = wx.cloud.database()
    db.collection('contactInfo').limit(1).get().then(res => {
      console.log('联系信息查询结果:', res)
      if (res.data.length > 0) {
        const info = res.data[0]
        console.log('使用数据库中的联系信息:', info)
        this.setData({
          contactInfo: {
            name: info.name || '',
            description: info.description || ''
          },
          loading: false
        })
        if (info.qrcodeFileId) {
          this.convertQrcodeUrl(info.qrcodeFileId)
        }
      } else {
        console.log('数据库中没有联系信息')
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('加载联系信息失败:', err)
      this.setData({ loading: false })
    })
  },

  convertQrcodeUrl: function(fileId) {
    cloudStorage.getTempFileURL([fileId]).then(urlMap => {
      if (urlMap[fileId]) {
        this.setData({
          'contactInfo.qrcodeUrl': urlMap[fileId]
        })
      }
    }).catch(err => {
      console.error('获取临时URL失败:', err)
    })
  },

  goToAdmin: function () {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  onShareAppMessage() {
    return {
      title: '联系我们 - 潘潘的美妝穿搭合集',
      path: '/pages/contact/contact',
      imageUrl: ''
    }
  }
})
