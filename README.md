# 牛奶猫的猎人笔记

[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-blue)](https://starneko.com)
[![VitePress](https://img.shields.io/badge/VitePress-1.6.4-brightgreen)](https://vitepress.dev)

基于 VitePress 构建的个人系统安全研究博客，专注于 CTF、PWN、漏洞利用等领域的学习笔记与 Writeup

🌐 **在线访问**：[https://starneko.com](https://starneko.com)

## 项目结构

```
hunternote/
├── docs/
│   ├── .vitepress/         # VitePress 配置
│   ├── public/             # 静态资源
│   ├── ctfs/               # CTF 平台 Writeup
│   │   ├── buuctf/
│   │   ├── ctfshow/
│   │   │   └── pwnvip360/  # PWN VIP 360 课程
│   │   └── nssctf/
│   ├── labs/               # 实战平台 Writeup
│   │   ├── htb-academy/
│   │   ├── htb-lab/
│   │   └── pwn-college/
│   ├── cves/               # CVE 漏洞复现
│   ├── notes/              # 技术学习笔记
│   │   └── android/
│   ├── links/              # 友情链接
│   ├── sitemap/            # 网站地图
│   └── whoami/             # 关于作者
├── .github/workflows/      # GitHub Actions
├── package.json
└── README.md
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。推送到 `main` 分支会自动触发部署

## 功能特性

- ✅ 自动部署到 GitHub Pages
- ✅ 本地搜索功能
- ✅ 响应式设计
- ✅ 深色模式支持
- ✅ 友链系统
- ✅ SEO 优化

## 内容分类

### CTF 平台
- **BUUCTF** - 北京联合大学 CTF 练习平台
- **CTFshow** - PWN VIP 360 系统化课程（360 个靶场）
- **NSSCTF** - 综合性 CTF 平台，CVE 复现、AI 安全

### 实战平台
- **HTB Academy** - 结构化网络安全学习平台
- **HTB Lab** - 渗透测试实战平台
- **pwn.college** - ASU 系统安全学习平台（腰带系统）

### 其他
- **Notes** - 技术学习笔记与研究总结
- **CVEs** - 漏洞复现、POC、EXP
- **Links** - 友情链接
- **Whoami** - 关于作者

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) - Creative Commons Attribution-NonCommercial 4.0 International

本作品采用知识共享署名-非商业性使用 4.0 国际许可协议进行许可
