import { defineConfig } from 'vitepress'

function getSidebar() {
  return [
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
            { text: 'PWN VIP 360', link: '/ctfs/ctfshow/pwnvip360/' }
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
          link: '/labs/pwn-college/',
          items: [
            { text: 'lv1', link: '/labs/pwn-college/lv1/' }
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
      { text: 'Notes', link: '/cves/' },
      { text: 'Friends', link: '/friends/' },
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
      '/whoami/': [],
      '/friends/': [],
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

