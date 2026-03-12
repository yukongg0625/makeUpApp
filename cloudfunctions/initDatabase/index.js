// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 初始化分类集合
    await createCategories()
    
    // 初始化子分类集合
    await createSubcategories()
    
    // 初始化轮播图集合
    await createBanners()
    
    // 初始化示例作品
    await createSampleWorks()
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (err) {
    console.error('初始化失败:', err)
    return {
      success: false,
      message: '初始化失败：' + err.message
    }
  }
}

// 创建分类数据
async function createCategories() {
  const categories = [
    { _id: '1', name: '汉服', icon: '/images/category-hanfu.png', order: 1, enabled: true },
    { _id: '2', name: '旗袍', icon: '/images/category-qipao.png', order: 2, enabled: true },
    { _id: '3', name: '礼服', icon: '/images/category-dress.png', order: 3, enabled: true },
    { _id: '4', name: '沙丽', icon: '/images/category-sari.png', order: 4, enabled: true },
    { _id: '5', name: '和服', icon: '/images/category-kimono.png', order: 5, enabled: true }
  ]

  for (const category of categories) {
    try {
      await db.collection('categories').doc(category._id).set({
        data: category
      })
    } catch (err) {
      console.log('分类已存在:', category.name)
    }
  }
}

// 创建子分类数据
async function createSubcategories() {
  const subcategories = [
    { _id: '1', name: '服装租赁', order: 1, enabled: true },
    { _id: '2', name: '整体造型', order: 2, enabled: true },
    { _id: '3', name: '化妆造型', order: 3, enabled: true }
  ]

  for (const subcategory of subcategories) {
    try {
      await db.collection('subcategories').doc(subcategory._id).set({
        data: subcategory
      })
    } catch (err) {
      console.log('子分类已存在:', subcategory.name)
    }
  }
}

// 创建轮播图数据
async function createBanners() {
  const banners = [
    {
      _id: 'banner1',
      imageUrl: 'https://example.com/banner1.jpg',
      link: '',
      order: 1,
      enabled: true
    },
    {
      _id: 'banner2',
      imageUrl: 'https://example.com/banner2.jpg',
      link: '',
      order: 2,
      enabled: true
    }
  ]

  for (const banner of banners) {
    try {
      await db.collection('banners').doc(banner._id).set({
        data: banner
      })
    } catch (err) {
      console.log('轮播图已存在:', banner._id)
    }
  }
}

// 创建示例作品数据
async function createSampleWorks() {
  const sampleWorks = [
    {
      _id: 'work1',
      title: '汉服 | 与诺',
      subtitle: '古典优雅系列',
      categoryId: 1,
      categoryName: '汉服',
      subcategoryId: 2,
      subcategoryName: '整体造型',
      coverUrl: 'https://example.com/work1.jpg',
      images: ['https://example.com/work1-1.jpg', 'https://example.com/work1-2.jpg'],
      description: '古典汉服造型，展现东方美学',
      details: ['精致妆容', '传统发髻', '配饰搭配'],
      isFeatured: true,
      enabled: true,
      order: 1,
      createTime: db.serverDate()
    },
    {
      _id: 'work2',
      title: '汉服 | 长歌系列',
      subtitle: '明制汉服',
      categoryId: 1,
      categoryName: '汉服',
      subcategoryId: 2,
      subcategoryName: '整体造型',
      coverUrl: 'https://example.com/work2.jpg',
      images: ['https://example.com/work2-1.jpg', 'https://example.com/work2-2.jpg'],
      description: '明制汉服，端庄大气',
      details: ['明代妆容', '传统头饰', '礼服搭配'],
      isFeatured: true,
      enabled: true,
      order: 2,
      createTime: db.serverDate()
    },
    {
      _id: 'work3',
      title: '旗袍 | 花样年华',
      subtitle: '复古风情',
      categoryId: 2,
      categoryName: '旗袍',
      subcategoryId: 2,
      subcategoryName: '整体造型',
      coverUrl: 'https://example.com/work3.jpg',
      images: ['https://example.com/work3-1.jpg'],
      description: '复古旗袍造型，重现老上海风情',
      details: ['复古妆容', '手推波发型', '珍珠配饰'],
      isFeatured: true,
      enabled: true,
      order: 3,
      createTime: db.serverDate()
    },
    {
      _id: 'work4',
      title: '礼服 | 星空',
      subtitle: '晚宴礼服',
      categoryId: 3,
      categoryName: '礼服',
      subcategoryId: 3,
      subcategoryName: '化妆造型',
      coverUrl: 'https://example.com/work4.jpg',
      images: ['https://example.com/work4-1.jpg'],
      description: '星空主题晚宴造型',
      details: ['闪亮妆容', '盘发造型', '水晶配饰'],
      isFeatured: false,
      enabled: true,
      order: 4,
      createTime: db.serverDate()
    }
  ]

  for (const work of sampleWorks) {
    try {
      await db.collection('works').doc(work._id).set({
        data: work
      })
    } catch (err) {
      console.log('作品已存在:', work.title)
    }
  }
}
