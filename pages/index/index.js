const app = getApp()

Page({
  data: {
    features: [],
    featuredWorks: [],
    loading: false
  },

  onLoad: function () {
    this.loadFeatures()
    this.loadFeaturedWorks()
  },

  onShow: function () {
    this.loadFeatures()
    this.loadFeaturedWorks()
  },

  loadFeatures() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    db.collection('categories')
      .where({
        enabled: true
      })
      .orderBy('order', 'asc')
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const allFeatures = res.data
          const features = allFeatures.filter(item => {
            const hidden = item.hidden
            return hidden !== true && hidden !== 'true'
          })
          console.log('过滤后的影集:', features)
          
          if (features.length > 0) {
            this.convertCloudStorageUrls(features, 'coverImage')
              .then(convertedFeatures => {
                this.setData({
                  features: convertedFeatures,
                  loading: false
                })
              })
              .catch(err => {
                console.error('转换图片 URL 失败:', err)
                this.setData({
                  features: features,
                  loading: false
                })
              })
          } else {
            this.setData({
              features: [],
              loading: false
            })
          }
        } else {
          console.warn('categories 集合为空，使用降级数据')
          this.setData({
            features: this.getFallbackFeatures(),
            loading: false
          })
        }
      })
      .catch(err => {
        console.error('加载影集失败:', err)
        console.warn('使用降级数据')
        this.setData({
          features: this.getFallbackFeatures(),
          loading: false
        })
      })
  },

  convertCloudStorageUrls(data, fieldName) {
    console.log('开始转换云存储 URL, 字段:', fieldName)
    console.log('原始数据:', data)

    const fileIds = data
      .filter(item => item[fieldName] && item[fieldName].startsWith('cloud://'))
      .map(item => item[fieldName])

    console.log('需要转换的 File IDs:', fileIds)

    if (fileIds.length === 0) {
      console.log('没有需要转换的 File ID')
      return Promise.resolve(data)
    }

    return this.tryGetTempUrlsWithFallback(fileIds)
      .then(urlMap => {
        const result = data.map(item => {
          if (item[fieldName] && item[fieldName].startsWith('cloud://')) {
            const newUrl = urlMap[item[fieldName]] || item[fieldName]
            console.log('替换 URL:', item[fieldName], '->', newUrl)
            return {
              ...item,
              [fieldName]: newUrl
            }
          }
          return item
        })
        console.log('转换后的数据:', result)
        return result
      })
  },

  tryGetTempUrlsWithFallback(fileIds) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getImageUrl',
        data: {
          action: 'getTempFileURL',
          fileList: fileIds
        },
        success: res => {
          console.log('getImageUrl 云函数返回结果:', res)
          if (res.result && res.result.success) {
            resolve(res.result.urlMap || {})
          } else {
            console.warn('云函数返回失败，降级到前端获取')
            this.getTempUrlsDirectly(fileIds).then(resolve).catch(reject)
          }
        },
        fail: err => {
          console.warn('调用云函数失败，降级到前端获取:', err)
          this.getTempUrlsDirectly(fileIds).then(resolve).catch(reject)
        }
      })
    })
  },

  getTempUrlsDirectly(fileIds) {
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: fileIds
      }).then(res => {
        console.log('前端直接获取 temp URL:', res)
        const urlMap = {}
        res.fileList.forEach(file => {
          if (file.status === 0) {
            urlMap[file.fileID] = file.tempFileURL
          }
        })
        resolve(urlMap)
      }).catch(err => {
        console.error('前端获取 temp URL 失败:', err)
        reject(err)
      })
    })
  },

  getFallbackFeatures() {
    return [
      { _id: '1', name: '化妆造型', coverImage: '', order: 1, enabled: true },
      { _id: '2', name: '整体造型', coverImage: '', order: 2, enabled: true },
      { _id: '3', name: '服装租赁', coverImage: '', order: 3, enabled: true },
      { _id: '4', name: '饰品租赁', coverImage: '', order: 4, enabled: true },
      { _id: '5', name: '美妆私教', coverImage: '', order: 5, enabled: true }
    ]
  },

  loadFeaturedWorks() {
    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('featured')
      .where({ _id: _.exists(true) })
      .orderBy('order', 'asc')
      .limit(10)
      .get()
      .then(res => {
        const featured = res.data.map(item => ({
          ...item,
          coverUrl: item.coverImage || ''
        }))

        this.convertCloudStorageUrls(featured, 'coverUrl')
          .then(featuredWorks => {
            this.setData({
              featuredWorks: featuredWorks,
              loading: false
            })
          })
          .catch(err => {
            console.error('转换图片 URL 失败:', err)
            this.setData({
              featuredWorks: featured,
              loading: false
            })
          })
      })
      .catch(err => {
        console.error('加载精华相册失败:', err)
        this.setData({ loading: false })
      })
  },

  onFeatureTap(e) {
    const featureId = e.currentTarget.dataset.id
    const featureName = e.currentTarget.dataset.name

    wx.navigateTo({
      url: `/pages/feature/feature?id=${featureId}&name=${encodeURIComponent(featureName)}`
    })
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${workId}`
    })
  },

  onViewFeatured() {
    wx.navigateTo({
      url: '/pages/featured/featured'
    })
  },

  onPullDownRefresh() {
    this.loadFeatures()
    this.loadFeaturedWorks()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})