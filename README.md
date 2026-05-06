# 潘潘的美妝穿搭合集 - 化妆造型作品展示小程序

这是一个专业的化妆造型作品展示小程序，用于展示化妆造型作品，并提供预约化妆和租赁服装饰品的功能。

## 功能特性

### 前端功能
- ✅ 首页：
  - 横向导航栏：以化妆造型作品图片为各个影集的展示封面，点击进入对应影集
  - 影集包括：化妆造型、整体造型、服装租赁、饰品租赁、美妆私教
  - 精华相册：展示精选照片
  - 底部导航：主页、创意展示、联系我们
- ✅ 影集页面：
  - 左侧固定竖向导航条，显示当前影集的子类
  - 多排列表展示子类作品缩略图
  - 点击缩略图查看系列清晰大图，支持上下滑动
  - 右侧中部固定"联系店家"按钮，可发送至微信聊天预约
  - 底部导航保持显示
- ✅ 精华相册页面：
  - 多排列表展示缩略图片
  - 点击查看清晰大图，显示说明文字和用途类型
  - 右侧中部固定"联系店家"按钮
- ✅ 联系我们：
  - 普通用户：自动弹出微信聊天窗口
  - 管理员：跳过聊天窗口，显示后台管理入口

### 后端功能（云开发）
- ✅ 影集管理：添加、删除、修改影集及其封面图片
- ✅ 子类管理：添加、删除、修改影集下的子类
- ✅ 作品管理：添加、删除、修改子类下的系列作品
- ✅ 图片管理：为系列作品添加、修改图片及其说明和类型
- ✅ 精华相册管理：添加、删除、修改精华相册图片
- ✅ 云数据库：影集、子类、作品、预约等数据管理
- ✅ 云存储：图片上传和 CDN 加速
- ✅ 云函数：数据库初始化、登录验证和后台管理操作
- ✅ 管理员识别：基于 OpenID 的管理员权限控制

## 项目结构

```
makeupApp/
├── pages/                    # 页面目录
│   ├── index/               # 首页
│   ├── feature/             # 影集页面
│   ├── detail/              # 作品详情页
│   ├── featured/            # 精华相册页面
│   ├── contact/             # 联系我们页面
│   └── admin/               # 后台管理页面
│       ├── admin/           # 后台管理入口
│       ├── categories/      # 影集管理
│       ├── subcategories/   # 子类管理
│       ├── works/           # 作品管理
│       └── featured/        # 精华相册管理
├── components/              # 自定义组件
│   └── tab-bar/            # 自定义底部导航组件
├── cloudfunctions/          # 云函数目录
│   ├── initDatabase/        # 数据库初始化云函数
│   ├── login/              # 登录验证云函数（获取 OpenID）
│   └── setDatabasePermissions/ # 数据库权限检查云函数
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

## 后端架构说明

### 云开发方案（推荐）
本项目使用**微信云开发**作为后端方案，**无需自建服务器**：

- **云数据库**：存储功能集、子类、作品、预约等数据
- **云存储**：存储图片资源，自动 CDN 加速
- **云函数**：处理后台管理操作（增删改查）

### 当前后端代码状态
- ✅ `cloudfunctions/initDatabase/` - 数据库初始化云函数（已完成）
- ✅ `cloudfunctions/login/` - 登录验证云函数，获取用户 OpenID（已完成）
- ✅ `cloudfunctions/setDatabasePermissions/` - 数据库权限检查云函数（已完成）
- ✅ `pages/admin/` - 后台管理页面（已完成）
  - ✅ 影集管理（增删改查）
  - ✅ 子类管理（增删改查）
  - ✅ 作品管理（增删改查，支持图片上传）
  - ✅ 精华相册管理（增删改查）

### 如何调试后端功能

#### 1. 云函数本地调试
1. 在微信开发者工具中，右键点击云函数目录
2. 选择"本地调试"→"开启本地调试"
3. 在云函数代码中设置断点
4. 在小程序中调用云函数，即可在开发者工具中调试

#### 2. 云函数日志调试
1. 上传云函数：右键点击云函数目录→"上传并部署：云端安装依赖"
2. 在小程序中调用云函数
3. 打开"云开发控制台"→"云函数"→选择对应函数→"日志"
4. 查看 `console.log` 输出和错误信息

#### 3. 数据库调试
1. 打开"云开发控制台"→"数据库"
2. 选择对应集合，查看/修改数据
3. 可直接在控制台添加测试数据

#### 4. 云存储调试
1. 打开"云开发控制台"→"存储"
2. 上传图片文件
3. 复制文件 ID 或下载链接，用于数据库记录

### 后台管理功能说明
后台管理功能已完整实现：
1. ✅ 创建 `cloudfunctions/login/` 云函数，获取用户 OpenID
2. ✅ 创建 `pages/admin/` 管理页面，提供可视化操作界面
3. ✅ 基于 OpenID 的管理员权限控制
4. ✅ 通过云数据库 API 实现影集、子类、作品的增删改查
5. ✅ 使用云存储 API 实现图片上传功能
6. ✅ 云存储 File ID 自动转换为临时 URL 显示

### 管理员配置
1. 部署 `cloudfunctions/login/` 云函数
2. 打开小程序，进入"联系我们"页面
3. 查看控制台输出，获取当前用户的 OpenID
4. 在 `app.js` 中，将 OpenID 添加到 `adminOpenIds` 数组：
   ```javascript
   adminOpenIds: [
     '你的OpenID', // 替换为实际的 OpenID
   ],
   ```
5. 重新编译，管理员进入"联系我们"页面时将跳过聊天窗口，并显示"后台管理"入口

### 进入后台管理
1. 普通用户：进入"联系我们"页面，自动弹出聊天窗口
2. 管理员：进入"联系我们"页面，跳过聊天窗口，点击底部"后台管理"按钮
3. 后台管理功能：
   - **影集管理**：添加/编辑/删除影集，设置封面图片和排序
   - **子类管理**：添加/编辑/删除子类，关联影集，设置排序
   - **作品管理**：添加/编辑/删除作品，上传封面和作品图片，设置用途类型和描述
   - **精华相册管理**：从已有作品中选择添加到精华相册，设置排序

### 集合说明

#### 1. categories（影集集合）
```javascript
{
  _id: String,              // 影集 ID
  name: String,             // 影集名称（如：化妆造型、整体造型、服装租赁、饰品租赁、美妆私教）
  coverImage: String,       // 影集封面图片路径
  order: Number,            // 排序
  enabled: Boolean          // 是否启用
}
```

#### 2. subcategories（子类集合）
```javascript
{
  _id: String,              // 子类 ID
  categoryId: String,       // 影集 ID
  categoryName: String,     // 影集名称
  name: String,             // 子类名称（如：妆造1、妆造2、租赁1等）
  order: Number,            // 排序
  enabled: Boolean          // 是否启用
}
```

#### 3. works（作品集合）
```javascript
{
  _id: String,              // 作品 ID
  title: String,            // 作品标题
  categoryId: String,       // 影集 ID
  categoryName: String,     // 影集名称
  subcategoryId: String,    // 子类 ID
  subcategoryName: String,  // 子类名称
  coverUrl: String,         // 封面图 URL
  images: Array,            // 图片数组
  description: String,      // 作品描述
  usageType: String,        // 用途类型（服装租赁、整体造型、化妆造型）
  isFeatured: Boolean,      // 是否精选
  enabled: Boolean,         // 是否启用
  order: Number,            // 排序
  createTime: Date          // 创建时间
}
```

#### 4. featured（精华相册集合）
```javascript
{
  _id: String,              // 精华相册 ID
  workId: String,           // 关联作品 ID
  coverUrl: String,         // 封面图 URL
  title: String,            // 标题
  description: String,      // 说明文字
  usageType: String,        // 用途类型
  order: Number,            // 排序
  enabled: Boolean,         // 是否启用
  createTime: Date          // 创建时间
}
```

#### 5. bookings（预约集合）
```javascript
{
  _id: String,              // 预约 ID
  name: String,             // 客户姓名
  phone: String,            // 联系电话
  date: String,             // 预约日期
  time: String,             // 预约时间
  serviceType: String,      // 服务类型
  workId: String,           // 作品 ID
  workTitle: String,        // 作品标题
  remark: String,           // 备注
  status: String,           // 状态：pending/confirmed/completed/cancelled
  openid: String,           // 用户 openid
  createTime: Date          // 创建时间
}
```

## 快速开始

### 1. 环境准备
- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号，获取 AppID（正在申请过程中）
- 安装 WSL Ubuntu（已安装）

### 2. 导入项目
1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目目录：`makeupApp`
4. 填入您的 AppID（或使用测试号）
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
- `star.png` / `star-active.png` - 创意展示图标
- `contact.png` / `contact-active.png` - 联系我们图标
- `feature-makeup.png` - 化妆造型封面
- `feature-overall.png` - 整体造型封面
- `feature-clothing.png` - 服装租赁封面
- `feature-accessories.png` - 饰品租赁封面
- `feature-teaching.png` - 美妆私教封面

### 7. 编译运行
1. 点击开发者工具的"编译"按钮，即可在模拟器中预览小程序
2. 点击"预览"按钮，生成二维码，使用微信扫描即可在手机上查看效果

### 8. 调试步骤
1. **代码调试**：
   - 在开发者工具中，点击"调试器"面板
   - 设置断点、查看变量、监控网络请求

2. **模拟器调试**：
   - 在开发者工具中，选择不同的设备型号和屏幕尺寸
   - 测试小程序在不同设备上的显示效果

3. **真机调试**：
   - 点击"预览"按钮，生成二维码
   - 使用微信扫描二维码，在手机上进行真机测试

4. **WSL Ubuntu 调试**（如需搭建服务）：
   - 打开 WSL Ubuntu 终端
   - 导航到项目目录：`cd /mnt/e/oddfeelings/dev/weapp-makeup/makeupApp`
   - 安装依赖：`npm install`（如果需要）
   - 启动本地服务：`npm run dev`（如果需要）

5. **云开发调试**：
   - 在开发者工具中，点击"云开发"按钮
   - 查看云函数日志、数据库数据、存储文件

### 9. 常见问题处理
- **图片无法显示**：检查图片路径是否正确，确保图片已上传到云存储
- **云函数调用失败**：确保云函数已正确上传并部署，检查云环境 ID 配置
- **数据库查询报错**：检查数据库索引是否已创建，确保查询条件符合索引规则
- **页面跳转失败**：检查页面路径配置是否正确，确保页面文件存在

## 使用说明

### 后台管理（推荐）
1. 确保已配置管理员 OpenID（见"管理员配置"部分）
2. 进入"联系我们"页面，点击底部"后台管理"按钮
3. 使用可视化界面管理影集、子类、作品和精华相册
4. 支持图片上传、排序设置、状态切换等操作

### 管理影集（云开发控制台）
1. 在云开发控制台进入"数据库"
2. 选择 `categories` 集合
3. 点击"添加数据"添加新影集
4. 填写影集名称、封面图片路径等信息
5. 设置 `enabled: true` 启用影集

### 管理子类（云开发控制台）
1. 在云开发控制台进入"数据库"
2. 选择 `subcategories` 集合
3. 点击"添加数据"添加新子类
4. 填写子类名称、关联的影集 ID 等信息
5. 设置 `enabled: true` 启用子类

### 管理作品（云开发控制台）
1. 在云开发控制台进入"数据库"
2. 选择 `works` 集合
3. 点击"添加数据"添加新作品
4. 填写作品标题、关联的影集和子类、封面图、图片数组、描述、用途类型等信息
5. 设置 `enabled: true` 启用作品
6. 设置 `isFeatured: true` 加入精华相册

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
- [x] 实现后台管理系统
- [ ] 添加消息通知功能
- [ ] 支持更多分享渠道
- [ ] 优化图片加载性能
- [ ] 增加搜索功能
- [ ] 实现预约管理系统
- [ ] 添加数据统计和分析功能
- [ ] 实现拖拽排序功能（后台管理列表拖拽调整排序）

## 技术支持

如有问题，请查看：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 许可证

MIT License
