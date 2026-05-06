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
    // 先创建集合
    await createCollections()
    
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

// 创建集合
async function createCollections() {
  const collections = ['categories', 'subcategories', 'banners', 'works', 'featured']
  
  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName)
      console.log('创建集合成功:', collectionName)
      
      // 注意：微信云开发不支持通过代码设置集合权限
      // 需要在云开发控制台手动设置权限为"所有用户可读，仅创建者可读写"
    } catch (err) {
      console.log('集合已存在或创建失败:', collectionName, err.message)
    }
  }
}

// 创建影集数据
async function createCategories() {
  const categories = [
    { _id: '1', name: '化妆造型', coverImage: '', order: 1, enabled: true },
    { _id: '2', name: '整体造型', coverImage: '', order: 2, enabled: true },
    { _id: '3', name: '服装租赁', coverImage: '', order: 3, enabled: true },
    { _id: '4', name: '饰品租赁', coverImage: '', order: 4, enabled: true },
    { _id: '5', name: '美妆私教', coverImage: '', order: 5, enabled: true }
  ]

  for (const category of categories) {
    try {
      const result = await db.collection('categories').add({
        data: category
      })
      console.log('添加影集成功:', category.name, result._id)
    } catch (err) {
      console.error('添加影集失败:', category.name, err)
    }
  }
}

// 创建子类数据
async function createSubcategories() {
  const subcategories = [
    // 化妆造型子类
    { _id: '1-1', categoryId: '1', categoryName: '化妆造型', name: '妆造1', order: 1, enabled: true },
    { _id: '1-2', categoryId: '1', categoryName: '化妆造型', name: '妆造2', order: 2, enabled: true },
    { _id: '1-3', categoryId: '1', categoryName: '化妆造型', name: '妆造3', order: 3, enabled: true },
    // 整体造型子类
    { _id: '2-1', categoryId: '2', categoryName: '整体造型', name: '妆造1', order: 1, enabled: true },
    { _id: '2-2', categoryId: '2', categoryName: '整体造型', name: '妆造2', order: 2, enabled: true },
    { _id: '2-3', categoryId: '2', categoryName: '整体造型', name: '妆造3', order: 3, enabled: true },
    // 服装租赁子类
    { _id: '3-1', categoryId: '3', categoryName: '服装租赁', name: '租赁1', order: 1, enabled: true },
    { _id: '3-2', categoryId: '3', categoryName: '服装租赁', name: '租赁2', order: 2, enabled: true },
    { _id: '3-3', categoryId: '3', categoryName: '服装租赁', name: '租赁3', order: 3, enabled: true },
    // 饰品租赁子类
    { _id: '4-1', categoryId: '4', categoryName: '饰品租赁', name: '租赁1', order: 1, enabled: true },
    { _id: '4-2', categoryId: '4', categoryName: '饰品租赁', name: '租赁2', order: 2, enabled: true },
    { _id: '4-3', categoryId: '4', categoryName: '饰品租赁', name: '租赁3', order: 3, enabled: true },
    // 美妆私教子类
    { _id: '5-1', categoryId: '5', categoryName: '美妆私教', name: '美妆1', order: 1, enabled: true },
    { _id: '5-2', categoryId: '5', categoryName: '美妆私教', name: '美妆2', order: 2, enabled: true },
    { _id: '5-3', categoryId: '5', categoryName: '美妆私教', name: '美妆3', order: 3, enabled: true }
  ]

  for (const subcategory of subcategories) {
    try {
      const result = await db.collection('subcategories').add({
        data: subcategory
      })
      console.log('添加子类成功:', subcategory.name, result._id)
    } catch (err) {
      console.error('添加子类失败:', subcategory.name, err)
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
      const result = await db.collection('banners').add({
        data: banner
      })
      console.log('添加轮播图成功:', banner._id, result._id)
    } catch (err) {
      console.error('添加轮播图失败:', banner._id, err)
    }
  }
}

// 创建示例作品数据
async function createSampleWorks() {
  const sampleWorks = [
    {
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
      const result = await db.collection('works').add({
        data: work
      })
      console.log('添加作品成功:', work.title, result._id)
    } catch (err) {
      console.error('添加作品失败:', work.title, err)
    }
  }
}
