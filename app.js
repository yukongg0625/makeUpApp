App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'makeup-app-env',
        traceUser: true,
      })
    }

    this.globalData = {}
  },

  globalData: {
    categories: [
      { id: 1, name: '汉服', icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20hanfu%20dress%20elegant%20portrait&image_size=square' },
      { id: 2, name: '旗袍', icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20qipao%20dress%20traditional%20elegant&image_size=square' },
      { id: 3, name: '礼服', icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20evening%20gown%20formal%20dress&image_size=square' },
      { id: 4, name: '沙丽', icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=indian%20sari%20traditional%20dress%20colorful&image_size=square' },
      { id: 5, name: '和服', icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20kimono%20traditional%20dress&image_size=square' }
    ],
    subcategories: [
      { id: 1, name: '服装租赁' },
      { id: 2, name: '整体造型' },
      { id: 3, name: '化妆造型' }
    ]
  }
})
