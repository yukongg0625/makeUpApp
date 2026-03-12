Page({
  data: {
    workId: null,
    images: [],
    currentImageIndex: 0,
    workInfo: {
      title: '',
      description: '',
      categoryName: '',
      subcategoryName: '',
      details: []
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ workId: options.id })
      this.loadWorkDetail(options.id)
    }
  },

  loadWorkDetail(workId) {
    wx.showLoading({
      title: '加载中...'
    })

    // 模拟数据，用于临时展示
    const mockWorkDetails = {
      work1: {
        title: '汉服 | 与诺',
        description: '传统汉服造型，展现东方古典之美',
        categoryName: '汉服',
        subcategoryName: '整体造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20hanfu%20dress%20elegant%20portrait%20makeup%20styling&image_size=landscape_4_3',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20hanfu%20dress%20elegant%20portrait%20makeup%20styling&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20hanfu%20traditional%20dress%20full%20body%20portrait&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hanfu%20dress%20details%20embroidery%20close%20up&image_size=landscape_4_3'
        ],
        details: [
          { label: '风格', value: '传统汉服' },
          { label: '适用场景', value: '婚礼、写真、活动' },
          { label: '包含服务', value: '服装、发型、化妆' },
          { label: '服务时长', value: '3-4小时' }
        ]
      },
      work2: {
        title: '旗袍 | 雅韵',
        description: '经典旗袍造型，彰显女性优雅气质',
        categoryName: '旗袍',
        subcategoryName: '服装租赁',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20qipao%20dress%20traditional%20elegant%20makeup%20styling&image_size=landscape_4_3',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20qipao%20dress%20traditional%20elegant%20makeup%20styling&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=qipao%20dress%20full%20body%20portrait%20elegant&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=qipao%20dress%20details%20seam%20close%20up&image_size=landscape_4_3'
        ],
        details: [
          { label: '风格', value: '经典旗袍' },
          { label: '适用场景', value: '派对、婚礼、商务活动' },
          { label: '包含服务', value: '服装租赁' },
          { label: '租赁时长', value: '1天' }
        ]
      },
      work3: {
        title: '礼服 | 星辰',
        description: '华丽礼服造型，打造星光闪耀的你',
        categoryName: '礼服',
        subcategoryName: '整体造型',
        coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20evening%20gown%20formal%20dress%20makeup%20styling&image_size=landscape_4_3',
        images: [
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20evening%20gown%20formal%20dress%20makeup%20styling&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=evening%20gown%20full%20body%20portrait%20glamorous&image_size=landscape_4_3',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=evening%20gown%20details%20sequins%20close%20up&image_size=landscape_4_3'
        ],
        details: [
          { label: '风格', value: '华丽礼服' },
          { label: '适用场景', value: '晚宴、颁奖典礼、婚礼' },
          { label: '包含服务', value: '服装、发型、化妆' },
          { label: '服务时长', value: '2-3小时' }
        ]
      }
    }

    // 根据 workId 获取对应的模拟数据
    const work = mockWorkDetails[workId] || mockWorkDetails.work1
    const images = work.images || [work.coverUrl]
    
    this.setData({
      images,
      workInfo: {
        title: work.title || '作品详情',
        description: work.description || '',
        categoryName: work.categoryName || '',
        subcategoryName: work.subcategoryName || '',
        details: work.details || []
      }
    })
    
    wx.hideLoading()
  },

  onImageChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.shareAppMessage({
            title: this.data.workInfo.title,
            path: `/pages/detail/detail?id=${this.data.workId}`
          })
        } else if (res.tapIndex === 1) {
          wx.shareTimeline({
            title: this.data.workInfo.title,
            query: `id=${this.data.workId}`,
            imageUrl: this.data.images[0]
          })
        }
      }
    })
  },

  onContact() {
    wx.makePhoneCall({
      phoneNumber: '13800138000',
      fail: () => {
        wx.showToast({
          title: '呼叫失败',
          icon: 'none'
        })
      }
    })
  },

  onBookNow() {
    wx.navigateTo({
      url: `/pages/booking/booking?workId=${this.data.workId}&workTitle=${encodeURIComponent(this.data.workInfo.title)}`
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.workInfo.title,
      path: `/pages/detail/detail?id=${this.data.workId}`,
      imageUrl: this.data.images[0]
    }
  }
})
