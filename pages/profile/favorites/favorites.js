// pages/profile/favorites/favorites.js
const cloudStorage = require('../../../utils/cloudStorage.js')

Page({
  data: {
    favorites: [],
    favoriteRows: [],
    loading: true
  },

  onLoad: function () {
    this.loadFavorites()
  },

  loadFavorites: function () {
    const app = getApp()
    if (!app.globalData.userId) {
      this.setData({ loading: false })
      return
    }

    const db = wx.cloud.database()
    const _ = db.command

    db.collection('favorites').where({
      userId: app.globalData.userId
    }).orderBy('createTime', 'desc').get().then(res => {
      const favorites = res.data

      if (favorites.length === 0) {
        this.setData({ favorites: [], favoriteRows: [], loading: false })
        return
      }

      const workIds = favorites.map(f => f.workId)

      db.collection('works').where({
        _id: _.in(workIds)
      }).get().then(workRes => {
        const workMap = {}
        workRes.data.forEach(w => { workMap[w._id] = w })

        const favoritesWithCovers = favorites.map(item => {
          const work = workMap[item.workId]
          return {
            ...item,
            coverUrl: (work && work.images && work.images[0]) || item.coverImage || ''
          }
        })

        const rows = []
        for (let i = 0; i < favoritesWithCovers.length; i += 2) {
          rows.push(favoritesWithCovers.slice(i, i + 2))
        }

        const fileIds = favoritesWithCovers.filter(f => f.coverUrl && f.coverUrl.startsWith('cloud://')).map(f => f.coverUrl)

        if (fileIds.length > 0) {
          cloudStorage.getTempFileURL(fileIds).then(urlMap => {
            favoritesWithCovers.forEach(f => {
              if (f.coverUrl && f.coverUrl.startsWith('cloud://')) {
                f.coverUrl = urlMap[f.coverUrl] || f.coverUrl
              }
            })
            this.setData({ favorites: favoritesWithCovers, favoriteRows: rows, loading: false })
          }).catch(() => {
            this.setData({ favorites: favoritesWithCovers, favoriteRows: rows, loading: false })
          })
        } else {
          this.setData({ favorites: favoritesWithCovers, favoriteRows: rows, loading: false })
        }
      }).catch(err => {
        console.error('获取作品数据失败:', err)
        this.setData({ loading: false })
      })
    }).catch(err => {
      console.error('加载收藏列表失败:', err)
      this.setData({ loading: false })
    })
  },

  onItemTap: function (e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + workId })
  },

  onShareAppMessage() {
    return {
      title: '潘潘的美妝穿搭合集',
      path: '/pages/index/index'
    }
  }
})