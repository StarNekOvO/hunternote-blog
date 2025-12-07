# VitePress Blog

这是从 Hexo 迁移到 VitePress 的博客项目。

## 项目结构

```
vitepress-blog/
├── docs/                    # 文档目录
│   ├── .vitepress/         # VitePress 配置
│   │   └── config.ts       # 配置文件
│   ├── notes/              # 笔记文章（待迁移）
│   ├── img/                # 图片资源（待迁移）
│   ├── file/               # 文件资源（待迁移）
│   ├── index.md            # 首页
│   └── whoami/             # whoami 页面
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

## 待迁移内容

- [ ] 笔记文章（source/_posts/）
- [ ] 图片资源（source/img/）
- [ ] 文件资源（source/file/）
- [ ] 文章分类和标签系统
- [ ] 归档功能

## 配置说明

配置文件位于 `docs/.vitepress/config.ts`，包含：
- 站点基本信息（标题、描述等）
- 导航栏配置
- 侧边栏配置
- 搜索功能
- SEO 元数据

