Page({
  data: {
    workId: null,
    selectedWork: null,
    formData: {
      name: '',
      phone: '',
      date: '',
      time: '',
      serviceType: null,
      remark: ''
    },
    serviceTypes: [
      { id: 1, name: '服装租赁' },
      { id: 2, name: '整体造型' },
      { id: 3, name: '化妆造型' },
      { id: 4, name: '全套服务' }
    ],
    minDate: new Date().toISOString().split('T')[0],
    canSubmit: false
  },

  onLoad: function (options) {
    if (options.workId) {
      this.setData({ workId: options.workId })
      this.loadWorkInfo(options.workId)
    }
  },

  loadWorkInfo(workId) {
    wx.cloud.database()
      .collection('works')
      .doc(workId)
      .get()
      .then(res => {
        this.setData({
          selectedWork: res.data
        })
      })
      .catch(err => {
        console.error('加载作品信息失败:', err)
      })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    
    const formData = { ...this.data.formData, [field]: value }
    this.setData({ formData })
    
    this.checkCanSubmit()
  },

  onDateChange(e) {
    const date = e.detail.value
    const formData = { ...this.data.formData, date }
    this.setData({ formData })
    this.checkCanSubmit()
  },

  onTimeChange(e) {
    const time = e.detail.value
    const formData = { ...this.data.formData, time }
    this.setData({ formData })
    this.checkCanSubmit()
  },

  onServiceTypeSelect(e) {
    const serviceTypeId = e.currentTarget.dataset.id
    const serviceTypeName = e.currentTarget.dataset.name
    
    const formData = { ...this.data.formData, serviceType: serviceTypeId, serviceTypeName }
    this.setData({ formData })
  },

  checkCanSubmit() {
    const { name, phone, date, time } = this.data.formData
    const canSubmit = !!(name && phone && date && time)
    this.setData({ canSubmit })
  },

  onSubmit() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(this.data.formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '提交中...'
    })

    const bookingData = {
      ...this.data.formData,
      workId: this.data.workId,
      workTitle: this.data.selectedWork?.title || '',
      status: 'pending',
      createTime: new Date(),
      openid: wx.getStorageSync('openid') || ''
    }

    wx.cloud.database()
      .collection('bookings')
      .add({
        data: bookingData
      })
      .then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '预约成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('预约失败:', err)
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      })
  }
})
