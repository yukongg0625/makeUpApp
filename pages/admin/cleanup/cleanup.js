// pages/admin/cleanup/cleanup.js
const app = getApp()

Page({
  data: {
    scanning: false,
    stats: {
      totalReferenced: 0,
      totalWorks: 0,
      totalCategories: 0,
      totalCustomerPhotos: 0
    },
    referencedFileIds: [],
    message: ''
  },

  onLoad: function() {
    this.scanStats()
  },

  onShow: function() {
    this.scanStats()
  },

  scanStats: function() {
    this.setData({ scanning: true })

    wx.cloud.callFunction({
      name: 'scanOrphanedFiles',
      data: {
        action: 'checkAllImages'
      }
    }).then(res => {
      this.setData({ scanning: false })
      console.log('扫描结果:', res)
      
      if (res.result && res.result.success) {
        this.setData({
          stats: res.result.stats || {},
          referencedFileIds: res.result.referencedFileIds || [],
          message: res.result.message || ''
        })
      } else {
        wx.showToast({
          title: res.result?.message || '扫描失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      this.setData({ scanning: false })
      console.error('扫描失败:', err)
      wx.showToast({
        title: '扫描失败',
        icon: 'error'
      })
    })
  },

  onRefresh: function() {
    this.scanStats()
  },

  copyFileIds: function() {
    const fileIds = this.data.referencedFileIds.join('\n')
    wx.setClipboardData({
      data: fileIds,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  }
})
