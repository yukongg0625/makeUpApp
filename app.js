App({
  onLaunch: function () {
    console.log('=== 小程序启动 ===')
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      this.globalData.cloudReady = false
    } else {
      try {
        wx.cloud.init({
          env: 'cloud1-d6gmlx4ss77f8e361',
          traceUser: true,
        })
        console.log('云开发初始化成功')
        this.globalData.cloudReady = true
      } catch (err) {
        console.error('云开发初始化失败:', err)
        this.globalData.cloudReady = false
      }
    }

    this.globalData = {
      cloudReady: false,
      // 管理员 OpenID 列表（添加你的 OpenID）
      adminOpenIds: [
        // '你的OpenID',
        'oVa-r7fs5JMPsNfOGrGniUUTCB0M',
      ],
      // 当前用户 OpenID
      currentOpenId: null,
      // 是否为管理员
      isAdmin: false
    }
    
    // 获取当前用户 OpenID
    this.getCurrentUserOpenId()
  },

  // 获取当前用户 OpenID
  getCurrentUserOpenId: function() {
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openId = res.result.openid
      this.globalData.currentOpenId = openId
      this.globalData.isAdmin = this.globalData.adminOpenIds.includes(openId)
      console.log('当前用户 OpenID:', openId)
      console.log('是否为管理员:', this.globalData.isAdmin)
    }).catch(err => {
      console.error('获取 OpenID 失败:', err)
    })
  },

  globalData: {
    categories: [],
    subcategories: {},
    // 管理员 OpenID 列表（添加你的 OpenID）
    adminOpenIds: [
      // '你的OpenID',
      'oVa-r7fs5JMPsNfOGrGniUUTCB0M',
    ],
    // 当前用户 OpenID
    currentOpenId: null,
    // 是否为管理员
    isAdmin: false
  }
})
