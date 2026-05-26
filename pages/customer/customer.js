const cloudStorage = require('../../utils/cloudStorage.js')

Page({
  data: {
    photos: [],
    photoRows: [],
    albumName: '美丽瞬间',
    loading: false
  },

  onLoad: function () {
    this.loadAlbumName()
    this.loadPhotos()
  },

  onShow: function () {
    this.loadAlbumName()
    this.loadPhotos()
    this.updateTabBar()
  },

  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const db = wx.cloud.database()
      db.collection('settings').doc('customerAlbum').get()
        .then(res => {
          if (res.data && res.data.albumName) {
            this.getTabBar().setData({
              selected: 1,
              albumName: res.data.albumName,
              middleTab: null
            })
          } else {
            this.getTabBar().setData({ selected: 1, middleTab: null })
          }
        })
        .catch(() => {
          this.getTabBar().setData({ selected: 1, middleTab: null })
        })
    }
  },

  loadAlbumName() {
    const db = wx.cloud.database()
    db.collection('settings').doc('customerAlbum').get()
      .then(res => {
        if (res.data && res.data.albumName) {
          this.setData({ albumName: res.data.albumName })
        }
      })
      .catch(err => {
        if (err.errCode !== -502005) {
          console.error('加载相册名称失败:', err)
        }
      })
  },

  loadPhotos() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    db.collection('customerPhotos')
      .where({ hidden: false })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        const photos = res.data
        this.convertCloudStorageUrls(photos, 'imageUrl').then(convertedPhotos => {
          const rows = []
          for (let i = 0; i < convertedPhotos.length; i += 2) {
            rows.push(convertedPhotos.slice(i, i + 2))
          }
          this.setData({
            photos: convertedPhotos,
            photoRows: rows,
            loading: false
          })
        })
      })
      .catch(err => {
        console.error('加载客照失败:', err)
        this.setData({ loading: false })
      })
  },

  // 转换云存储 File ID 为临时 URL
  convertCloudStorageUrls: function(data, fieldName) {
    return cloudStorage.convertCloudStorageUrls(data, fieldName)
  },

  onPhotoTap(e) {
    const photoId = e.currentTarget.dataset.id
    const photo = this.data.photos.find(p => p._id === photoId)
    if (photo) {
      wx.previewImage({
        urls: [photo.imageUrl],
        current: photo.imageUrl
      })
    }
  },

  onPullDownRefresh() {
    this.loadPhotos()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  onShareAppMessage() {
    return {
      title: this.data.albumName || '美丽瞬间 - 潘潘的美妝穿搭合集',
      path: '/pages/customer/customer',
      imageUrl: ''
    }
  }
})