// pages/contact/contact.js
Page({
  data: {
    contactInfo: {
      name: '畔黛造型',
      phone: '13800138000',
      wechat: 'pandai_makeup',
      address: '北京市朝阳区建国路88号'
    },
    isAdmin: false,
    openId: ''
  },

  onLoad: function () {
    const app = getApp()
    
    // 检查是否为管理员
    if (app.globalData.isAdmin) {
      this.setData({
        isAdmin: true,
        openId: app.globalData.currentOpenId
      })
      // 管理员不自动弹出聊天窗口
      console.log('管理员登录，跳过聊天弹窗')
    } else {
      // 非管理员，弹出聊天窗口
      this.openWechatChat()
    }
  },

  openWechatChat: function () {
    // 模拟跳转到微信聊天
    wx.showModal({
      title: '联系我们',
      content: '将跳转到微信聊天，与畔黛造型客服联系',
      success: function (res) {
        if (res.confirm) {
          // 实际项目中，这里可以使用 wx.openCustomerServiceChat 或其他方式打开微信聊天
          wx.showToast({
            title: '正在打开微信聊天...',
            icon: 'loading',
            duration: 2000
          })
        }
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
  }
})
