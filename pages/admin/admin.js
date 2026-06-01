// pages/admin/admin.js
Page({
  data: {
    version: '1.5.4'
  },

  onLoad: function (options) {
  },

  onMenuTap: function (e) {
    const type = e.currentTarget.dataset.type
    
    const pageMap = {
      'categories': '/pages/admin/categories/categories',
      'subcategories': '/pages/admin/subcategories/subcategories',
      'works': '/pages/admin/works/works',
      'featured': '/pages/admin/featured/featured',
      'contact': '/pages/admin/contact/contact',
      'customer': '/pages/admin/customer/customer',
      'cleanup': '/pages/admin/cleanup/cleanup'
    }
    
    const url = pageMap[type]
    if (url) {
      wx.navigateTo({
        url: url
      })
    }
  }
})