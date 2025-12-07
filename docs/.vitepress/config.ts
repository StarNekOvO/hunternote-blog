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
      items: []
    },
    {
      text: 'Labs',
      collapsed: false,
      link: '/labs/',
      items: []
    }
  ]
}

export default defineConfig({
  title: '牛奶猫的猎人笔记',
  description: "StarNekOvO's Security Research Notes",
  lang: 'zh-CN',
  
  head: [
    ['link', { rel: 'icon', href: '/img/Milk.jpg' }],
    ['meta', { name: 'author', content: 'StarNekOvO' }],
    ['meta', { property: 'og:title', content: '牛奶猫的猎人笔记' }],
    ['meta', { property: 'og:type', content: 'blog' }],
    ['meta', { property: 'og:url', content: 'https://starneko.com' }],
    ['meta', { property: 'og:image', content: '/img/Milk.jpg' }],
    ['meta', { property: 'og:site_name', content: '牛奶猫的猎人笔记' }],
    ['meta', { property: 'og:description', content: 'Backend, Algorithm, Cybersecurity | Dev&Team Lead | MSCS at CU Boulder 🎓 | Piano🎹, Guitar🎸, Archery🏹, Driving 🦽🚲🛵🏎️ | Pansexuality | INFJ' }],
  ],

  themeConfig: {
    logo: '/img/Milk.jpg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Notes', link: '/cves/' },
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
      '/whoami/': []
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

