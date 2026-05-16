// pages/admin/contact/contact.js
Page({
  data: {
    formData: {
      name: '',
      description: '',
      phone: '',
      wechat: '',
      address: ''
    },
    loading: true
  },

  onLoad: function () {
    this.loadContactInfo()
  },

  loadContactInfo: function () {
    const db = wx.cloud.database()
    db.collection('contactInfo').get().then(res => {
      if (res.data.length > 0) {
        const contactInfo = res.data[0]
        this.setData({
          formData: {
            name: contactInfo.name || '',
            description: contactInfo.description || '',
            phone: contactInfo.phone || '',
            wechat: contactInfo.wechat || '',
            address: contactInfo.address || ''
          },
          loading: false
        })
      } else {
        // 如果没有数据，使用默认值
        this.setData({
          formData: {
            name: '畔黛造型',
            description: '专业化妆造型服务',
            phone: '13800138000',
            wechat: 'pandai_makeup',
            address: '北京市朝阳区建国路88号'
          },
          loading: false
        })
      }
    }).catch(err => {
      console.error('加载联系信息失败:', err)
      this.setData({ loading: false })
    })
  },

  onNameInput: function (e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  onDescriptionInput: function (e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  onPhoneInput: function (e) {
    this.setData({ 'formData.phone': e.detail.value })
  },

  onWechatInput: function (e) {
    this.setData({ 'formData.wechat': e.detail.value })
  },

  onAddressInput: function (e) {
    this.setData({ 'formData.address': e.detail.value })
  },

  onSave: function () {
    const { name, description, phone, wechat, address } = this.data.formData
    
    if (!name) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' })
      return
    }
    
    if (!phone) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const db = wx.cloud.database()
    
    // 先检查是否已有数据
    db.collection('contactInfo').get().then(res => {
      if (res.data.length > 0) {
        // 更新现有数据
        const docId = res.data[0]._id
        db.collection('contactInfo').doc(docId).update({
          data: {
            name,
            description,
            phone,
            wechat,
            address,
            updateTime: new Date()
          }
        }).then(() => {
          wx.hideLoading()
          wx.showToast({ 
            title: '保存成功', 
            icon: 'success',
            duration: 2000 
          })
          // 延迟后返回上一页
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }).catch(err => {
          wx.hideLoading()
          wx.showToast({ title: '保存失败', icon: 'error' })
          console.error('更新联系信息失败:', err)
        })
      } else {
        // 添加新数据
        db.collection('contactInfo').add({
          data: {
            name,
            description,
            phone,
            wechat,
            address,
            createTime: new Date(),
            updateTime: new Date()
          }
        }).then(() => {
          wx.hideLoading()
          wx.showToast({ 
            title: '保存成功', 
            icon: 'success',
            duration: 2000 
          })
          // 延迟后返回上一页
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            })
          }, 1500)
        }).catch(err => {
          wx.hideLoading()
          wx.showToast({ title: '保存失败', icon: 'error' })
          console.error('添加联系信息失败:', err)
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('查询联系信息失败:', err)
    })
  }
})