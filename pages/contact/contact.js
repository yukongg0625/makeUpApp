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
    // 页面显示时重新检查管理员状态
    this.checkAdminStatus()
    // 页面显示时重新加载数据，确保从管理页面返回时能看到更新
    this.loadContactInfo()
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
    db.collection('contactInfo').get().then(res => {
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
        // 如果失败，回退到复制微信号
        wx.showModal({
          title: '联系客服',
          content: '客服功能暂时不可用，请复制微信号联系我们：' + this.data.contactInfo.wechat,
          confirmText: '复制',
          success: function (res) {
            if (res.confirm) {
              wx.setClipboardData({
                data: this.data.contactInfo.wechat,
                success: function () {
                  wx.showToast({ title: '微信号已复制', icon: 'success' })
                }
              })
            }
          }.bind(this)
        })
      }.bind(this)
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
  }
})