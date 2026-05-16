App({
  globalData: {
    cloudReady: false,
    categories: [],
    subcategories: {},
    // 当前用户 OpenID
    currentOpenId: null,
    // 是否为管理员
    isAdmin: false
  },

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

    // 获取当前用户 OpenID
    this.getCurrentUserOpenId()
  },

  // 获取当前用户 OpenID 并检查管理员身份
  getCurrentUserOpenId: function() {
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openId = res.result.openid
      this.globalData.currentOpenId = openId
      console.log('当前用户 OpenID:', openId)

      // 使用云函数检查管理员身份（绕过安全规则限制）
      wx.cloud.callFunction({
        name: 'checkAdmin',
        data: {
          openId: openId
        }
      }).then(adminRes => {
        this.globalData.isAdmin = adminRes.result && adminRes.result.isAdmin
        console.log('是否为管理员:', this.globalData.isAdmin)

        // 通知所有页面管理员状态已更新
        const pages = getCurrentPages()
        pages.forEach(page => {
          if (page.onAdminStatusUpdate) {
            page.onAdminStatusUpdate(this.globalData.isAdmin)
          }
        })
      }).catch(err => {
        console.error('检查管理员状态失败:', err)
        this.globalData.isAdmin = false
        console.log('是否为管理员:', this.globalData.isAdmin)
      })
    }).catch(err => {
      console.error('获取 OpenID 失败:', err)
    })
  }
})