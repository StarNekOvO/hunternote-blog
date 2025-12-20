import { defineConfig } from 'vitepress'

function getSidebar() {
  return [
    {
      text: 'Notes',
      collapsed: false,
      link: '/notes/',
      items: [
        {
          text: 'Android',
          link: '/notes/android/',
          collapsed: false,
          items: [
            {
              text: '0 Foundation',
              collapsed: false,
              items: [
                { text: '0x00 环境', link: '/notes/android/00-foundation/00-environment-setup' },
                { text: '0x01 架构演进', link: '/notes/android/00-foundation/01-architecture-overview' },
                { text: '0x02 构建系统', link: '/notes/android/00-foundation/02-build-system' },
              ]
            },
            {
              text: '1 Sandbox',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/01-sandbox/' },
                { text: '1x00 UID/GID 隔离', link: '/notes/android/01-sandbox/00-uid-gid-isolation' },
                { text: '1x01 Zygote 进程', link: '/notes/android/01-sandbox/01-zygote-process' },
                { text: '1x02 权限模型', link: '/notes/android/01-sandbox/02-permission-model' },
                { text: '1x03 存储隔离', link: '/notes/android/01-sandbox/03-storage-isolation' },
                { text: '1x04 四大组件安全', link: '/notes/android/01-sandbox/04-app-components' },
              ]
            },
            {
              text: '2 IPC',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/02-ipc/' },
                { text: '2x00 Binder 深度解析', link: '/notes/android/02-ipc/00-binder-deep-dive' },
                { text: '2x01 Intent 系统安全', link: '/notes/android/02-ipc/01-intent-system' },
                { text: '2x02 HIDL 与 AIDL', link: '/notes/android/02-ipc/02-hidl-aidl' },
                { text: '2x03 其他 IPC 机制', link: '/notes/android/02-ipc/03-other-ipc' },
              ]
            },
            {
              text: '3 System Services',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/03-services/' },
                { text: '3x00 system_server 架构', link: '/notes/android/03-services/00-system-server' },
                { text: '3x01 AMS 深度解析', link: '/notes/android/03-services/01-ams' },
                { text: '3x02 PMS 深度解析', link: '/notes/android/03-services/02-pms' },
                { text: '3x03 WMS 深度解析', link: '/notes/android/03-services/03-wms' },
                { text: '3x04 媒体框架安全', link: '/notes/android/03-services/04-media-framework' },
              ]
            },
            {
              text: '4 Native Layer',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/04-native/' },
                { text: '4x00 Bionic Libc', link: '/notes/android/04-native/00-bionic-libc' },
                { text: '4x01 Linker 链接器', link: '/notes/android/04-native/01-linker' },
                { text: '4x02 Seccomp 机制', link: '/notes/android/04-native/02-seccomp' },
                { text: '4x03 ART 运行时', link: '/notes/android/04-native/03-art-runtime' },
                { text: '4x04 原生守护进程', link: '/notes/android/04-native/04-native-daemons' },
              ]
            },
            {
              text: '5 Kernel Security',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/05-kernel/' },
                { text: '5x00 内核概览', link: '/notes/android/05-kernel/00-kernel-overview' },
                { text: '5x01 SELinux', link: '/notes/android/05-kernel/01-selinux' },
                { text: '5x02 攻击面分析', link: '/notes/android/05-kernel/02-attack-surface' },
                { text: '5x03 内核缓解技术', link: '/notes/android/05-kernel/03-mitigations' },
                { text: '5x04 AVF 虚拟化', link: '/notes/android/05-kernel/04-avf' },
                { text: '5x05 内核利用技巧', link: '/notes/android/05-kernel/05-exploitation' },
              ]
            },
            {
              text: '6 Hardware Security',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/06-hardware/' },
                { text: '6x00 TrustZone', link: '/notes/android/06-hardware/00-trustzone' },
                { text: '6x01 ARM CCA', link: '/notes/android/06-hardware/01-arm-cca' },
                { text: '6x02 Verified Boot', link: '/notes/android/06-hardware/02-avb' },
                { text: '6x03 硬件 Keystore', link: '/notes/android/06-hardware/03-keystore' },
              ]
            },
            {
              text: '7 Special Topics',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/07-special/' },
                { text: '7x00 WebView 安全', link: '/notes/android/07-special/00-webview' },
                { text: '7x01 蓝牙安全', link: '/notes/android/07-special/01-bluetooth' },
                { text: '7x02 通信安全', link: '/notes/android/07-special/02-connectivity' },
              ]
            },
            {
              text: '8 Practical Research',
              collapsed: false,
              items: [
                { text: 'Overview', link: '/notes/android/08-practical/' },
                { text: '8x00 研究方法论', link: '/notes/android/08-practical/00-methodology' },
                { text: '8x01 调试与逆向', link: '/notes/android/08-practical/01-debugging' },
                { text: '8x02 漏洞利用开发', link: '/notes/android/08-practical/02-exploit-dev' },
                { text: '8x03 Bug Bounty 指南', link: '/notes/android/08-practical/03-bug-bounty' },
                { text: '8x04 CVE 案例研究', link: '/notes/android/08-practical/04-cve-studies' },
              ]
            }
          ]
        }
      ]
    },
    {
      text: 'CVEs',
      collapsed: false,
      link: '/cves/',
      items: []
    },
    {
      text: 'CTFs',
      collapsed: false,
      link: '/ctfs/',
      items: [
        { text: 'BUU CTF', link: '/ctfs/buuctf/' },
        {
          text: 'CTFshow',
          link: '/ctfs/ctfshow/',
          items: [
            { 
              text: 'PWN VIP 360', 
              link: '/ctfs/ctfshow/pwnvip360/',
              collapsed: false,
              items: [
                { text: '前置基础 (0-34)', link: '/ctfs/ctfshow/pwnvip360/01-fundamentals' },
                { text: '栈溢出与ROP (35-80)', link: '/ctfs/ctfshow/pwnvip360/02-stack-overflow' },
                { text: '格式化字符串漏洞 (91-100)', link: '/ctfs/ctfshow/pwnvip360/03-format-string' },
                { text: '整数安全 (101-110)', link: '/ctfs/ctfshow/pwnvip360/04-integer-security' },
                { text: 'Bypass安全机制 (111-134)', link: '/ctfs/ctfshow/pwnvip360/05-bypass-protection' },
                { text: '堆利用 (135-305)', link: '/ctfs/ctfshow/pwnvip360/06-heap-exploitation' },
                { text: 'PWN利用技巧 (306-324)', link: '/ctfs/ctfshow/pwnvip360/07-exploitation-tricks' },
                { text: '其他漏洞利用 (325-330)', link: '/ctfs/ctfshow/pwnvip360/08-other-vulnerabilities' },
                { text: '异构PWN (331-355)', link: '/ctfs/ctfshow/pwnvip360/09-cross-architecture' },
                { text: '内核PWN (356-360)', link: '/ctfs/ctfshow/pwnvip360/10-kernel-pwn' }
              ]
            }
          ]
        },
        { text: 'NSSCTF', link: '/ctfs/nssctf/' }
      ]
    },
    {
      text: 'Labs',
      collapsed: false,
      link: '/labs/',
      items: [
        { text: 'HTB Academy', link: '/labs/htb-academy/' },
        { text: 'HTB Lab', link: '/labs/htb-lab/' },
        {
          text: 'pwn.college',
          collapsed: false,
          link: '/labs/pwn-college/',
          items: [
            { text: 'Linux Luminarium 🐧', link: '/labs/pwn-college/linux-luminarium/' },
            { text: 'Computing 101 💻', link: '/labs/pwn-college/computing-101/' },
            { text: 'Playing With Programs 🔤', link: '/labs/pwn-college/playing-with-programs/' },
            { text: 'lv1 白色腰带 <img src="https://pwn.college/belt/white.svg" style="height: 1em; vertical-align: middle;">', link: '/labs/pwn-college/lv1/' },
            { text: 'lv2 橙色腰带 <img src="https://pwn.college/belt/orange.svg" style="height: 1em; vertical-align: middle;">', link: '/labs/pwn-college/lv2/' },
            { text: 'lv3 黄色腰带 <img src="https://pwn.college/belt/yellow.svg" style="height: 1em; vertical-align: middle;">', link: '/labs/pwn-college/lv3/' },
            { text: 'lv4 绿色腰带 <img src="https://pwn.college/belt/green.svg" style="height: 1em; vertical-align: middle;">', link: '/labs/pwn-college/lv4/' },
            { text: 'lv5 蓝色腰带 <img src="https://pwn.college/belt/blue.svg" style="height: 1em; vertical-align: middle;">', link: '/labs/pwn-college/lv5/' }
          ]
        }
      ]
    }
  ]
}

export default defineConfig({
  title: '牛奶猫的猎人笔记',
  description: "StarNekOvO's Security Research Notes",
  lang: 'zh-CN',
  base: '/', // 使用自定义域名时设置为根路径
  
  head: [
    // Favicons
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    
    // Web App Manifest
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    
    // Theme color for mobile browsers
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: '猎人笔记' }],
    
    // Other meta tags
    ['link', { rel: 'stylesheet', href: '/custom.css' }],
    ['link', { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }],
    ['meta', { name: 'author', content: 'StarNekOvO' }],
    ['meta', { property: 'og:title', content: '牛奶猫的猎人笔记' }],
    ['meta', { property: 'og:type', content: 'blog' }],
    ['meta', { property: 'og:url', content: 'https://starneko.com' }],
    ['meta', { property: 'og:image', content: '/img/Milk.jpg' }],
    ['meta', { property: 'og:site_name', content: '牛奶猫的猎人笔记' }],
    ['meta', { property: 'og:description', content: 'System Security Hunter. Freelancer. Python/Go/Rust. | MSCS at CU Boulder | maimaiDX ◂Ⓘ▸ ヨルシカ | INFJ' }],
  ],

  themeConfig: {
    logo: '/img/Milk.jpg',
    
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Notes',
        items: [
          { text: 'Notes', link: '/notes/' },
          { text: 'CVEs', link: '/cves/' },
          { text: 'CTFs', link: '/ctfs/' },
          { text: 'Labs', link: '/labs/' },
        ]
      },
      { text: 'Links', link: '/links/' },
      { text: 'whoami', link: '/whoami/' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/StarNekOvO' },
      { icon: 'twitter', link: 'https://x.com/StarNekOvO' },
      { icon: 'telegram', link: 'https://t.me/StarNekOvO' },
    ],

    footer: {
      message: 'Creative Commons Attribution-NonCommercial 4.0 International',
      copyright: 'Copyright © StarNekOvO'
    },

    search: {
      provider: 'local'
    },

    sidebar: {
      '/': getSidebar(),
      '/cves/': getSidebar(),
      '/ctfs/': getSidebar(),
      '/labs/': getSidebar(),
      '/notes/': getSidebar(),
      '/whoami/': [],
      '/links/': [],
      '/sitemap/': []
    },

    outline: {
      level: [2, 3],
      label: '目录'
    }
  },

  markdown: {
    lineNumbers: true
  }
})

