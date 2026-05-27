App({
  globalData: {
    cloudReady: false,
    categories: [],
    subcategories: {},
    currentOpenId: null,
    isAdmin: false,
    userInfo: null,
    userId: null
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

    this.getCurrentUserOpenId()
  },

  getCurrentUserOpenId: function() {
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const openId = res.result.openid
      this.globalData.currentOpenId = openId
      console.log('当前用户 OpenID:', openId)

      wx.cloud.callFunction({
        name: 'checkAdmin',
        data: {
          openId: openId
        }
      }).then(adminRes => {
        this.globalData.isAdmin = adminRes.result && adminRes.result.isAdmin
        console.log('是否为管理员:', this.globalData.isAdmin)

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
  },

  login: function() {
    return new Promise((resolve, reject) => {
      const app = this
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          const userProfile = res.userInfo
          app.globalData.userInfo = userProfile
          
          const db = wx.cloud.database()
          db.collection('users').where({
            openid: app.globalData.currentOpenId
          }).get().then(userRes => {
            if (userRes.data && userRes.data.length > 0) {
              app.globalData.userId = userRes.data[0]._id
              db.collection('users').doc(userRes.data[0]._id).update({
                data: {
                  nickName: userProfile.nickName,
                  avatarUrl: userProfile.avatarUrl,
                  updateTime: db.serverDate()
                }
              }).then(() => {
                resolve({ userId: app.globalData.userId, userInfo: userProfile })
              }).catch(reject)
            } else {
              db.collection('users').add({
                data: {
                  openid: app.globalData.currentOpenId,
                  nickName: userProfile.nickName,
                  avatarUrl: userProfile.avatarUrl,
                  createTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              }).then(addRes => {
                app.globalData.userId = addRes._id
                resolve({ userId: addRes._id, userInfo: userProfile })
              }).catch(reject)
            }
          }).catch(reject)
        },
        fail: reject
      })
    })
  },

  ensureLogin: function() {
    return new Promise((resolve, reject) => {
      const app = this
      if (app.globalData.userId && app.globalData.userInfo) {
        resolve({ userId: app.globalData.userId, userInfo: app.globalData.userInfo })
      } else {
        app.login().then(resolve).catch(reject)
      }
    })
  }
})