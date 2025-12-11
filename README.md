# 牛奶猫的猎人笔记

基于 VitePress 构建的个人安全研究博客，部署在 GitHub Pages。

## 项目结构

```
hunternote-blog/
├── docs/                    # 文档目录
│   ├── .vitepress/         # VitePress 配置
│   │   └── config.ts       # 配置文件
│   ├── public/             # 静态资源目录
│   │   ├── img/            # 图片资源
│   │   ├── custom.css      # 自定义样式
│   │   ├── sitemap.xml     # XML 网站地图
│   │   └── robots.txt      # 搜索引擎配置
│   ├── ctfs/               # CTF 相关文章
│   │   ├── buuctf/         # BUU CTF
│   │   ├── ctfshow/        # CTFshow
│   │   │   └── pwnvip360/  # PWN VIP 360 课程
│   │   ├── nssctf/         # NSSCTF
│   │   └── index.md        # CTF 平台总览
│   ├── cves/               # CVE 相关文章
│   │   └── index.md
│   ├── labs/               # 实战平台 Writeup
│   │   ├── htb-academy/    # HTB Academy
│   │   ├── htb-lab/        # HTB Lab
│   │   ├── pwn-college/    # pwn.college
│   │   └── index.md        # Labs 平台总览
│   ├── links/              # 友情链接页面
│   │   └── index.md
│   ├── sitemap/            # 网站地图页面
│   │   └── index.md
│   ├── whoami/             # 关于我
│   │   └── index.md
│   └── index.md            # 首页
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 部署工作流
├── package.json
└── README.md
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages：

- **触发条件**：推送到 `main` 分支
- **部署地址**：https://starneko.com
- **工作流文件**：`.github/workflows/deploy.yml`

### 部署配置

1. 在 GitHub 仓库设置中启用 Pages，选择 "GitHub Actions" 作为源
2. 配置自定义域名（如需要）
3. 每次推送到 `main` 分支会自动触发部署

## 功能特性

- ✅ **自动部署**：GitHub Actions 自动构建和部署
- ✅ **自定义样式**：圆形头像、友链卡片等自定义样式
- ✅ **友链系统**：支持头像、描述、自动获取网站图标
- ✅ **网站地图**：XML 和可视化站点地图，支持 SEO
- ✅ **本地搜索**：VitePress 内置本地搜索功能
- ✅ **响应式设计**：适配桌面和移动设备
- ✅ **深色模式**：支持系统主题切换

## 内容分类

### CTF 平台
- **BUUCTF**：北京联合大学 CTF 在线练习平台
- **CTFshow**：专注于 CTF 竞赛的在线练习平台
  - PWN VIP 360：PWN 付费大会员课程，共 360 个靶场
- **NSSCTF**：综合性 CTF 竞赛平台，提供 CVE 复现、AI 安全攻防模块

### 实战平台
- **HTB Academy**：Hack The Box 结构化学习平台
- **HTB Lab**：Hack The Box 渗透测试平台（仅记录退役靶机）
- **pwn.college**：亚利桑那州立大学系统安全学习平台

## 配置说明

配置文件位于 `docs/.vitepress/config.ts`，包含：
- 站点基本信息（标题、描述等）
- 导航栏配置
- 侧边栏配置（支持多级嵌套）
- 搜索功能
- SEO 元数据
- 自定义域名配置（`base: '/'`）
- 社交链接配置

## 静态资源

静态资源（图片、文件等）应放在 `docs/public/` 目录下，构建时会被复制到输出根目录。

**注意**：在 Markdown 和配置文件中引用静态资源时，使用绝对路径，如 `/img/Milk.jpg`。

## SEO 优化

- **网站地图**：`/sitemap.xml` - XML 格式网站地图
- **可视化地图**：`/sitemap/` - 用户可访问的站点地图页面
- **robots.txt**：`/robots.txt` - 搜索引擎爬虫配置
- **Meta 标签**：完整的 Open Graph 和 SEO 元数据

## 开发说明

### 添加新页面
1. 在 `docs/` 目录下创建对应的 Markdown 文件
2. 在 `docs/.vitepress/config.ts` 中更新侧边栏配置
3. 如需添加静态资源，放在 `docs/public/` 目录

### 自定义样式
- 样式文件：`docs/public/custom.css`
- 在 `docs/.vitepress/config.ts` 的 `head` 中引入

### 友链管理
编辑 `docs/links/index.md`，按照现有格式添加友情链接信息。

