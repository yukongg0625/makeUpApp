/**
 * 常量配置文件
 */

// API 基础路径
export const API_BASE = ''

// 图片 CDN 基础路径
export const IMAGE_CDN_BASE = ''

// 分页配置
export const PAGE_SIZE = 20

// 图片上传配置
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  quality: 0.8,
  width: 1080
}

// 预约状态
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const BOOKING_STATUS_TEXT = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

// 服务类型
export const SERVICE_TYPES = [
  { id: 1, name: '服装租赁' },
  { id: 2, name: '整体造型' },
  { id: 3, name: '化妆造型' },
  { id: 4, name: '全套服务' }
]

// 风格分类
export const CATEGORIES = [
  { id: 1, name: '汉服' },
  { id: 2, name: '旗袍' },
  { id: 3, name: '礼服' },
  { id: 4, name: '沙丽' },
  { id: 5, name: '和服' }
]

// 子分类
export const SUBCATEGORIES = [
  { id: 1, name: '服装租赁' },
  { id: 2, name: '整体造型' },
  { id: 3, name: '化妆造型' }
]

// 缓存键名
export const CACHE_KEYS = {
  USER_INFO: 'user_info',
  OPENID: 'openid',
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories'
}

// 缓存时间（毫秒）
export const CACHE_DURATION = {
  NORMAL: 5 * 60 * 1000, // 5 分钟
  LONG: 30 * 60 * 1000 // 30 分钟
}
