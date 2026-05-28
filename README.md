# 潘潘的美妝穿搭合集 - 化妆造型作品展示小程序

这是一个专业的化妆造型作品展示小程序，用于展示化妆造型作品，并提供联系客服预约的功能。

**当前版本：v1.7.0**
**开发分支：`customer_registration`**
**生产分支：`main`**

> ⚠️ 所有新功能和修改请在 `customer_registration` 分支上进行开发测试，确认无误后再合并到 `main` 分支发布。

## 分支说明

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 生产环境 | 已发布到微信平台的稳定版本 |
| `customer_registration` | 开发环境 | 新功能开发与测试，包含用户登录、收藏等功能 |

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
  - 右侧中部固定"联系我们"按钮，点击弹出客服弹窗
  - 底部导航保持显示
- ✅ 作品详情页：
  - 图片轮播展示，支持点击预览大图
  - 显示作品标题、用途类型、描述等信息
  - 右侧固定"联系我们"气泡按钮（圆形半透明样式）
  - 点击联系按钮：复制作品信息到剪贴板，弹出客服弹窗
  - 客服弹窗提供：直接联系、复制图片后联系、取消
  - 分享功能：分享给微信好友或朋友圈
- ✅ 精华相册页面：
  - 双列网格布局展示缩略图片
  - 点击查看清晰大图，显示说明文字和用途类型
  - 右侧中部固定"联系我们"按钮
- ✅ 客照页面（信任定格）：
  - 双列网格布局展示客照图片
  - 支持相册名称自定义
  - 底部导航保持显示
- ✅ 联系我们：
  - 普通用户：显示客服入口
  - 管理员：显示后台管理入口

### 客服功能
- ✅ 点击"联系我们"按钮自动复制作品信息到剪贴板
- ✅ 客服弹窗提供三种操作：
  - **直接联系**：直接打开客服会话（文字信息已复制）
  - **复制图片后联系**：下载并保存作品封面到相册，然后在客服聊天中发送图片
  - **取消**：关闭弹窗
- ✅ 客服消息支持48小时内回复
- ✅ 支持多客服人员协作（消息共享）

### 后端功能（云开发）
- ✅ 影集管理：添加、删除、修改影集及其封面图片，支持隐藏/显示切换
- ✅ 子类管理：添加、删除、修改影集下的子类，支持隐藏/显示切换
- ✅ 作品管理：添加、删除、修改子类下的系列作品
  - 支持精华状态切换（加入精华/移出精华）
  - 精华状态与精华相册自动双向同步
  - 支持隐藏/显示切换
- ✅ 图片管理：为系列作品添加、修改图片及其说明和类型
- ✅ 精华相册管理：添加、移出精华、修改精华相册图片
  - 添加作品时自动过滤已加入精华的作品
  - 编辑时仅可修改排序号
- ✅ 客照管理：添加、删除、修改客照图片，自定义相册名称
- ✅ 云数据库：影集、子类、作品、精华相册、客照等数据管理
- ✅ 云存储：图片上传和 CDN 加速
- ✅ 云函数：数据库初始化、登录验证和后台管理操作
- ✅ 管理员识别：基于 OpenID 的管理员权限控制
- ✅ 数据备份与恢复：本地脚本按层级导出数据库和图片，支持数据恢复

## 项目结构

```
weapp-makeup/
├── makeupApp/                    # 小程序项目目录
│   ├── pages/                    # 页面目录
│   │   ├── index/               # 首页
│   │   ├── feature/             # 影集页面
│   │   ├── detail/              # 作品详情页
│   │   ├── featured/            # 精华相册页面
│   │   ├── customer/            # 客照页面（信任定格）
│   │   ├── contact/             # 联系我们页面
│   │   ├── profile/             # 我的页面（v1.7.0 新增）
│   │   │   ├── profile/         # 用户个人中心
│   │   │   └── favorites/       # 我的收藏列表
│   │   └── admin/               # 后台管理页面
│   │       ├── admin/           # 后台管理入口
│   │       ├── categories/      # 影集管理
│   │       ├── subcategories/   # 子类管理
│   │       ├── works/           # 作品管理
│   │       ├── featured/        # 精华相册管理
│   │       ├── customer/        # 客照管理
│   │       └── contact/         # 联系信息管理
│   ├── custom-tab-bar/          # 自定义底部导航组件
│   ├── cloudfunctions/          # 云函数目录
│   │   ├── initDatabase/        # 数据库初始化云函数
│   │   ├── login/              # 登录验证云函数（获取 OpenID）
│   │   ├── setDatabasePermissions/ # 数据库权限检查云函数
│   │   ├── getImageUrl/        # 获取云存储临时URL云函数
│   │   ├── deleteDocument/     # 删除文档云函数
│   │   ── workImages/         # 作品图片管理云函数
│   ├── database/                # 数据库索引配置
│   ├── utils/                   # 工具函数
│   │   ├── util.js             # 通用工具函数
│   │   ├── constants.js        # 常量配置
│   │   └── cloudStorage.js     # 云存储URL转换工具
│   ├── images/                  # 图片资源
│   ├── config.js                # 应用配置（含云函数开关）
│   ├── app.js                   # 小程序入口
│   ├── app.json                 # 小程序配置
│   ├── app.wxss                 # 全局样式
│   └── project.config.json      # 项目配置
└── backupandrestore/             # 数据备份与恢复脚本
    ├── backup.js                # 备份脚本
    └── restore.js               # 恢复脚本
```

## 后端架构说明

### 云开发方案（推荐）
本项目使用**微信云开发**作为后端方案，**无需自建服务器**：

- **云数据库**：存储影集、子类、作品、精华相册等数据
- **云存储**：存储图片资源，自动 CDN 加速
- **云函数**：处理后台管理操作（增删改查）

### 当前后端代码状态
- ✅ `cloudfunctions/initDatabase/` - 数据库初始化云函数（已完成）
- ✅ `cloudfunctions/login/` - 登录验证云函数，获取用户 OpenID（已完成）
- ✅ `cloudfunctions/setDatabasePermissions/` - 数据库权限检查云函数（已完成）
- ✅ `cloudfunctions/getImageUrl/` - 获取云存储临时URL云函数（已完成）
- ✅ `cloudfunctions/deleteDocument/` - 删除文档云函数（已完成）
- ✅ `cloudfunctions/workImages/` - 作品图片管理云函数（已完成）
- ✅ `pages/admin/` - 后台管理页面（已完成）
  - ✅ 影集管理（增删改查）
  - ✅ 子类管理（增删改查）
  - ✅ 作品管理（增删改查，支持图片上传）
  - ✅ 精华相册管理（增删改查，移出精华）
- ✅ `backupScript/` - 数据备份脚本（已完成）

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

### 云存储配置

#### 开发环境（云存储权限受限）
当云存储权限设置为"仅创建者可读"时，需要修改 `config.js`：

```javascript
// config.js
module.exports = {
  storage: {
    // 使用云函数获取图片临时URL（绕过权限限制）
    useCloudFunctionForImageUrl: true
  },
  cloudEnv: 'your-env-id'
}
```

#### 生产环境（正式上线）
建议将云存储权限修改为"所有用户可读"，然后修改配置：

```javascript
// config.js
module.exports = {
  storage: {
    // 直接使用前端API获取临时URL（节省云函数调用次数）
    useCloudFunctionForImageUrl: false
  },
  cloudEnv: 'your-env-id'
}
```

**修改云存储权限步骤：**
1. 登录[云开发控制台](https://console.cloud.tencent.com/tcb)
2. 进入"存储"→"权限设置"
3. 将权限从"仅创建者可读"修改为"所有用户可读"
4. 修改 `config.js` 中的 `useCloudFunctionForImageUrl` 为 `false`

**优势：**
- 节省云函数调用配额（免费版每月 50 万次）
- 减少网络请求延迟
- 代码更简洁

### 进入后台管理
1. 普通用户：进入"联系我们"页面，显示客服入口
2. 管理员：进入"联系我们"页面，跳过聊天窗口，点击底部"后台管理"按钮
3. 后台管理功能：
   - **影集管理**：添加/编辑/删除影集，设置封面图片和排序
   - **子类管理**：添加/编辑/删除子类，关联影集，设置排序
   - **作品管理**：添加/编辑/删除作品，上传封面和作品图片，设置用途类型和描述
     - 网格布局展示子类中的作品
     - 默认第一个作品为封面，可点击其他作品设为封面
     - 点击作品弹出菜单：设为封面、编辑
     - 编辑界面仅可修改：照片、用途类型、描述、排序（不可修改影集和子类，减少误操作）
     - 删除操作需确认
   - **精华相册管理**：从已有作品中选择添加到精华相册，设置排序，移出精华
     - 添加作品时自动过滤已加入精华的作品
     - 编辑时仅可修改排序号
     - 移出精华时自动同步作品状态

### 集合说明

#### 1. categories（影集集合）
```javascript
{
  _id: String,              // 影集 ID
  name: String,             // 影集名称（如：化妆造型、整体造型、服装租赁、饰品租赁、美妆私教）
  coverImage: String,       // 影集封面图片路径
  order: Number,            // 排序
  hidden: Boolean,          // 是否隐藏
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
  hidden: Boolean,          // 是否隐藏
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
  coverImage: String,       // 封面图云存储File ID
  images: Array,            // 图片云存储File ID数组
  description: String,      // 作品描述
  usageType: String,        // 用途类型（服装租赁、整体造型、化妆造型）
  enabled: Boolean,         // 是否启用
  isFeatured: Boolean,      // 是否精华
  hidden: Boolean,          // 是否隐藏
  order: Number,            // 排序
  createTime: Date          // 创建时间
}
```

#### 4. featured（精华相册集合）
```javascript
{
  _id: String,              // 精华相册 ID
  workId: String,           // 关联作品 ID
  title: String,            // 标题
  categoryId: String,       // 影集 ID
  categoryName: String,     // 影集名称
  subcategoryId: String,    // 子类 ID
  subcategoryName: String,  // 子类名称
  coverImage: String,       // 封面图云存储File ID
  images: Array,            // 图片云存储File ID数组
  usageType: String,        // 用途类型
  description: String,      // 说明文字
  order: Number,            // 排序
  createTime: Date          // 创建时间
}
```

#### 5. customerPhotos（客照集合）
```javascript
{
  _id: String,              // 客照 ID
  imageUrl: String,         // 图片云存储File ID
  description: String,      // 图片描述
  order: Number,            // 排序
  hidden: Boolean,          // 是否隐藏
  createTime: Date          // 创建时间
}
```

#### 6. contactInfo（联系信息集合）
```javascript
{
  _id: String,              // 记录 ID
  name: String,             // 店铺名称
  phone: String,            // 联系电话（可选）
  wechat: String,           // 微信号（可选）
  address: String,          // 地址（可选）
  updateTime: Date          // 更新时间
}
```

#### 7. users（用户集合）
```javascript
{
  _id: String,              // 用户 ID
  openid: String,           // 微信 OpenID
  nickName: String,         // 用户昵称
  avatarUrl: String,        // 头像 URL
  createTime: Date,         // 创建时间
  updateTime: Date          // 更新时间
}
```

#### 8. favorites（收藏集合）
```javascript
{
  _id: String,              // 收藏记录 ID
  workId: String,           // 作品 ID
  userId: String,           // 用户 ID
  workTitle: String,        // 作品标题
  coverImage: String,       // 作品封面图 File ID
  createTime: Date          // 收藏时间
}
```

#### 9. settings（设置集合）
```javascript
{
  _id: String,              // 设置项 ID（如：customerAlbum）
  albumName: String         // 客照相册名称（如：信任定格）
}
```

## 数据备份与恢复

### 备份脚本说明
项目提供本地备份脚本，可按影集→子类→作品的层级结构导出数据库和图片。

**位置**：`backupandrestore/`

**使用方法**：
```bash
cd backupandrestore
npm install
npm run backup
```

**备份输出结构**：
```
backup/
└── backup_2026-05-17T.../
    ├── database.json      # 完整数据库导出
    ├── report.json        # 备份报告
    ├── README.md          # 备份说明
    └── works/             # 作品图片（按层级组织）
        ├── [影集名称]/
        │   ├── [子类名称]/
        │   │   ├── [作品名称]/
        │   │   │   ├── meta.json    # 作品元数据
        │   │   │   ├── cover.jpg    # 封面
        │   │   │   └── image_1.jpg  # 作品图片
```

**备份功能**：
- 导出所有集合数据（categories、subcategories、works、featured、customerPhotos、contactInfo）
- 自动处理云存储 File ID，转换为临时URL后下载图片
- 按影集/子类/作品三级目录结构组织图片
- 并发下载，提高效率
- 自动生成备份报告和README

### 恢复脚本说明
项目提供数据恢复脚本，可将备份数据导入云数据库。

**使用方法**：
```bash
cd backupandrestore
npm install
npm run restore -- <backup_dir>
```

**恢复功能**：
- 从备份目录读取数据库JSON文件
- 按集合逐个导入数据到云数据库
- 支持冲突处理（跳过/覆盖）
- 自动生成恢复报告

## 快速开始

### 1. 环境准备
- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号，获取 AppID
- 开通微信云开发服务

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

### 6. 配置客服功能
1. 登录[小程序管理后台](https://mp.weixin.qq.com/)
2. 进入【功能】→【客服】→【客服管理】
3. 点击【添加】，输入客服人员的微信号
4. 客服人员通过微信扫码确认绑定
5. 绑定后即可在小程序中使用客服功能

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

4. **云开发调试**：
   - 在开发者工具中，点击"云开发"按钮
   - 查看云函数日志、数据库数据、存储文件

### 9. 常见问题处理
- **图片无法显示**：检查图片路径是否正确，确保图片已上传到云存储
- **云函数调用失败**：确保云函数已正确上传并部署，检查云环境 ID 配置
- **数据库查询报错**：检查数据库索引是否已创建，确保查询条件符合索引规则
- **客服功能不可用**：确保已在小程序后台绑定客服人员
- **复制失败提示**：检查剪贴板权限，确保数据不为空

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

### 管理精华相册（云开发控制台）
1. 在云开发控制台进入"数据库"
2. 选择 `featured` 集合
3. 点击"添加数据"添加精华作品
4. 填写关联作品 ID、排序等信息
5. 删除记录仅从精华相册移出，不会删除原始作品

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

### Q: 客服功能不可用？
A: 确保已在小程序后台绑定客服人员，个人小程序也支持客服功能。

### Q: 复制信息失败？
A: 检查数据是否为空，某些系统可能限制剪贴板操作。

### Q: 聊天窗口自动关闭？
A: 这通常表示客服功能未在后台正确配置，请检查客服人员绑定状态。

## 后续优化

- [x] 添加用户登录功能
- [x] 增加收藏功能（作品详情页悬浮收藏按钮 + 我的收藏页面）
- [x] 实现后台管理系统
- [x] 增加页面分享功能（转发给好友/微信群）
- [ ] 添加消息通知功能
- [ ] 支持更多分享渠道
- [x] 优化图片加载性能
- [x] 统一云存储URL转换工具
- [x] 实现精华状态双向同步
- [x] 实现客照管理功能
- [x] 实现数据备份与恢复脚本
- [ ] 增加搜索功能
- [ ] 实现预约管理系统
- [ ] 添加数据统计和分析功能
- [ ] 实现拖拽排序功能（后台管理列表拖拽调整排序）
- [ ] 实现服饰租赁/售卖功能
- [ ] 增加用户评论功能

## 技术支持

如有问题，请查看：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [小程序客服功能文档](https://developers.weixin.qq.com/miniprogram/introduction/custom.html)

## 许可证

MIT License
