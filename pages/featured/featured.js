Page({
  data: {
    featuredWorks: [],
    loading: false,
    hasMore: true,
    skip: 0,
    limit: 20
  },

  onLoad: function () {
    this.loadFeaturedWorks()
  },

  loadFeaturedWorks() {
    if (this.data.loading) return

    if (this.data.skip === 0) {
      this.setData({ loading: true })
    }

    const db = wx.cloud.database()
    db.collection('works')
      .where({ isFeatured: true, enabled: true })
      .orderBy('order', 'asc')
      .skip(this.data.skip)
      .limit(this.data.limit)
      .get()
      .then(res => {
        const works = res.data.map(item => ({
          ...item,
          id: item._id,
          coverUrl: item.coverImage || ''
        }))
        
        // 转换云存储 File ID 为临时 URL
        this.convertCloudStorageUrls(works, 'coverUrl').then(convertedWorks => {
          this.setData({
            featuredWorks: this.data.skip === 0 ? convertedWorks : [...this.data.featuredWorks, ...convertedWorks],
            hasMore: convertedWorks.length >= this.data.limit,
            loading: false,
            skip: this.data.skip + convertedWorks.length
          })
        })
      })
      .catch(err => {
        console.error('加载精华相册失败:', err)
        this.setData({ loading: false })
      })
  },

  // 转换云存储 File ID 为临时 URL
  convertCloudStorageUrls: function(data, fieldName) {
    const fileIds = data
      .filter(item => item[fieldName] && item[fieldName].startsWith('cloud://'))
      .map(item => item[fieldName])
    
    if (fileIds.length === 0) {
      return Promise.resolve(data)
    }
    
    return wx.cloud.getTempFileURL({
      fileList: fileIds
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(file => {
        urlMap[file.fileID] = file.tempFileURL
      })
      
      return data.map(item => {
        if (item[fieldName] && item[fieldName].startsWith('cloud://')) {
          return {
            ...item,
            [fieldName]: urlMap[item[fieldName]] || item[fieldName]
          }
        }
        return item
      })
    }).catch(err => {
      console.error('转换云存储 URL 失败:', err)
      return data
    })
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFeaturedWorks()
    }
  },

  onPullDownRefresh() {
    this.setData({
      featuredWorks: [],
      skip: 0,
      hasMore: true
    })
    this.loadFeaturedWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})
