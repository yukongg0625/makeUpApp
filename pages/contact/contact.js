// pages/contact/contact.js
Page({
  data: {
    contactInfo: {
      name: '',
      description: '',
      phone: '',
      wechat: '',
      address: ''
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
    this.checkAdminStatus()
    this.loadContactInfo()
    this.updateTabBar()
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
            selected: 2,
            albumName: albumName,
            list: list
          })
        })
        .catch(() => {
          const list = this.getTabBar().data.list
          list[1].text = '客照'
          this.getTabBar().setData({
            selected: 2,
            albumName: '客照',
            list: list
          })
        })
    }
  },

  // 检查管理员状态
  checkAdminStatus: function () {
    const app = getApp()
    
    // 如果 globalData 已经初始化，直接检查
    if (app.globalData.currentOpenId) {
      this.setData({
        isAdmin: app.globalData.isAdmin,
        openId: app.globalData.currentOpenId
      })
      console.log('管理员状态（已加载）:', this.data.isAdmin)
    } else {
      // 等待一小段时间让 app.js 完成初始化
      setTimeout(() => {
        this.setData({
          isAdmin: app.globalData.isAdmin,
          openId: app.globalData.currentOpenId
        })
        console.log('管理员状态（延迟检查）:', this.data.isAdmin)
      }, 500)
    }
  },

  // 管理员状态更新回调（由 app.js 调用）
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
            description: info.description || '',
            phone: info.phone || '',
            wechat: info.wechat || '',
            address: info.address || ''
          },
          loading: false
        })
      } else {
        console.log('数据库中没有联系信息')
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('加载联系信息失败:', err)
      this.setData({ loading: false })
    })
  },

  openWechatChat: function () {
    wx.openCustomerServiceChat({
      success: function () {
        console.log('打开客服聊天成功')
      },
      fail: function (err) {
        console.error('打开客服聊天失败:', err)
        wx.showToast({
          title: '客服功能暂未开通，请稍后再试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  onPhoneCall: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.contactInfo.phone
    })
  },

  onCopyWechat: function () {
    wx.setClipboardData({
      data: this.data.contactInfo.wechat,
      success: function () {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        })
      }
    })
  },

  goToAdmin: function () {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  switchTab(e) {
    const page = e.currentTarget.dataset.page
    wx.switchTab({ url: page })
  },

  onShareAppMessage() {
    return {
      title: '联系我们 - 潘潘的美妝穿搭合集',
      path: '/pages/contact/contact',
      imageUrl: ''
    }
  }
})