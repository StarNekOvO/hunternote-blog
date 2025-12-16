import { defineConfig } from 'vitepress'

function getSidebar() {
  return [
    {
      text: 'Notes',
      collapsed: false,
      link: '/notes/',
      items: [
        {
          text: 'Android Internals',
          link: '/notes/android-internals/',
          collapsed: false,
          items: [
            { text: '安卓架构演进：整体到模块化', link: '/notes/android-internals/android-evolution' }
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
    ['link', { rel: 'icon', href: '/img/Milk.jpg' }],
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

