# 造型师小程序

这是一个专业的造型师作品集展示小程序，用于展示汉服、旗袍、礼服、沙丽、和服等不同风格的造型作品，并提供预约服务。

## 功能特性

### 前端功能
- ✅ 首页展示：圆形分类导航 + 风格合集网格布局
- ✅ 作品集列表：支持按风格和子分类筛选
- ✅ 作品详情：全屏图片轮播查看 + 详细信息展示
- ✅ 预约功能：在线填写预约信息并提交
- ✅ 精选集：展示精选的优质作品
- ✅ 分享功能：支持分享给微信好友和朋友圈

### 后端功能（云开发）
- ✅ 云数据库：作品、分类、预约等数据管理
- ✅ 云存储：图片上传和 CDN 加速
- ✅ 云函数：数据库初始化

## 项目结构

```
makeupApp/
├── pages/                    # 页面目录
│   ├── index/               # 首页
│   ├── gallery/             # 作品集列表页
│   ├── detail/              # 作品详情页
│   ├── booking/             # 预约页
│   └── featured/            # 精选页
├── cloudfunctions/          # 云函数目录
│   └── initDatabase/        # 数据库初始化云函数
├── database/                # 数据库索引配置
├── utils/                   # 工具函数
│   ├── util.js             # 通用工具函数
│   └── constants.js        # 常量配置
├── images/                  # 图片资源
├── app.js                   # 小程序入口
├── app.json                 # 小程序配置
├── app.wxss                 # 全局样式
└── project.config.json      # 项目配置
```

## 数据库结构

### 集合说明

#### 1. categories（分类集合）
```javascript
{
  _id: String,              // 分类 ID
  name: String,             // 分类名称（如：汉服、旗袍）
  icon: String,             // 分类图标路径
  order: Number,            // 排序
  enabled: Boolean          // 是否启用
}
```

#### 2. subcategories（子分类集合）
```javascript
{
  _id: String,              // 子分类 ID
  name: String,             // 子分类名称（如：服装租赁、整体造型）
  order: Number,            // 排序
  enabled: Boolean          // 是否启用
}
```

#### 3. works（作品集合）
```javascript
{
  _id: String,              // 作品 ID
  title: String,            // 作品标题
  subtitle: String,         // 副标题
  categoryId: Number,       // 分类 ID
  categoryName: String,     // 分类名称
  subcategoryId: Number,    // 子分类 ID
  subcategoryName: String,  // 子分类名称
  coverUrl: String,         // 封面图 URL
  images: Array,            // 图片数组
  description: String,      // 作品描述
  details: Array,           // 详细信息列表
  isFeatured: Boolean,      // 是否精选
  enabled: Boolean,         // 是否启用
  order: Number,            // 排序
  createTime: Date          // 创建时间
}
```

#### 4. bookings（预约集合）
```javascript
{
  _id: String,              // 预约 ID
  name: String,             // 客户姓名
  phone: String,            // 联系电话
  date: String,             // 预约日期
  time: String,             // 预约时间
  serviceType: Number,      // 服务类型 ID
  serviceTypeName: String,  // 服务类型名称
  workId: String,           // 作品 ID
  workTitle: String,        // 作品标题
  remark: String,           // 备注
  status: String,           // 状态：pending/confirmed/completed/cancelled
  openid: String,           // 用户 openid
  createTime: Date          // 创建时间
}
```

#### 5. banners（轮播图集合）
```javascript
{
  _id: String,              // 轮播图 ID
  imageUrl: String,         // 图片 URL
  link: String,             // 跳转链接
  order: Number,            // 排序
  enabled: Boolean          // 是否启用
}
```

## 快速开始

### 1. 环境准备
- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号，获取 AppID

### 2. 导入项目
1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目目录：`makeupApp`
4. 填入您的 AppID
5. 点击"导入"

### 3. 配置云开发
1. 在开发者工具中点击"云开发"按钮
2. 创建云环境（如：makeup-app-env）
3. 记录环境 ID

### 4. 修改配置
修改以下文件中的环境配置：

**app.js**
```javascript
wx.cloud.init({
  env: 'your-env-id',  // 替换为您的云环境 ID
  traceUser: true,
})
```

**project.config.json**
```json
{
  "appid": "your-appid"  // 替换为您的小程序 AppID
}
```

### 5. 初始化数据库
1. 在开发者工具中，右键点击 `cloudfunctions/initDatabase` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待上传完成
4. 在云函数列表中，右键点击 `initDatabase`
5. 选择"执行"
6. 查看日志确认初始化成功

### 6. 上传图片资源
在 `images/` 目录下准备以下图标：
- `home.png` / `home-active.png` - 首页图标
- `star.png` / `star-active.png` - 精选图标
- `calendar.png` / `calendar-active.png` - 预约图标
- `category-hanfu.png` - 汉服分类图标
- `category-qipao.png` - 旗袍分类图标
- `category-dress.png` - 礼服分类图标
- `category-sari.png` - 沙丽分类图标
- `category-kimono.png` - 和服分类图标
- `empty.png` - 空状态图标

### 7. 编译运行
点击开发者工具的"编译"按钮，即可在模拟器中预览小程序

## 使用说明

### 添加作品
1. 在云开发控制台进入"数据库"
2. 选择 `works` 集合
3. 点击"添加数据"
4. 填写作品信息并上传封面图
5. 设置 `enabled: true` 启用作品

### 管理预约
1. 在云开发控制台进入"数据库"
2. 选择 `bookings` 集合
3. 查看所有预约记录
4. 可通过 `status` 字段筛选不同状态的预约

## 开发规范

### 代码风格
- 遵循微信小程序开发规范
- 使用 ES6+ 语法
- 保持代码缩进一致（2 空格）
- 添加必要的注释

### 命名规范
- 文件名：小写 + 中划线（如：`index.wxml`）
- 变量名：小驼峰（如：`workInfo`）
- 常量名：大写下划线（如：`PAGE_SIZE`）
- 集合名：复数形式（如：`works`, `categories`）

## 常见问题

### Q: 图片无法显示？
A: 检查图片 URL 是否正确，确保图片已上传到云存储或使用了有效的 CDN 地址。

### Q: 云函数调用失败？
A: 确保云函数已正确上传并部署，检查云环境 ID 配置是否正确。

### Q: 数据库查询报错？
A: 检查数据库索引是否已创建，确保查询条件符合索引规则。

## 后续优化

- [ ] 添加用户登录功能
- [ ] 增加评论和点赞功能
- [ ] 实现后台管理系统
- [ ] 添加消息通知功能
- [ ] 支持更多分享渠道
- [ ] 优化图片加载性能
- [ ] 增加搜索功能

## 技术支持

如有问题，请查看：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 许可证

MIT License
