import { defineConfig } from 'vitepress'
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CVE_FILE_RE = /^CVE-(\d{4})-(\d{4,7})\.md$/

function getCveSidebarItems() {
  const overviewItem = { text: '总览', link: '/cves/' }
  const indexItems = [
    { text: '按版本查看', link: '/cves/indexes/by-version' },
    { text: '按层级查看', link: '/cves/indexes/by-layer' },
    { text: '按组件查看', link: '/cves/indexes/by-component' },
    { text: '按漏洞类型查看', link: '/cves/indexes/by-cwe' },
  ]

  const byYear = new Map<string, Array<{ text: string; link: string }>>()

  try {
    const cveEntriesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'cves', 'entries')
    const files = readdirSync(cveEntriesDir)
      .filter((name: string) => CVE_FILE_RE.test(name))
      .sort((a: string, b: string) => b.localeCompare(a, 'en', { numeric: true }))

    for (const file of files) {
      const cve = file.replace(/\.md$/, '')
      const year = cve.slice(4, 8)
      const item = { text: cve, link: `/cves/entries/${cve}` }
      if (!byYear.has(year)) {
        byYear.set(year, [])
      }
      byYear.get(year)!.push(item)
    }
  } catch (error) {
    console.warn('[vitepress] Failed to scan CVE entries:', error)
  }

  const yearItems = Array.from(byYear.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, items]) => ({
      text: year,
      collapsed: true,
      items,
    }))

  return [
    overviewItem,
    {
      text: '索引',
      collapsed: false,
      items: indexItems,
    },
    {
      text: '漏洞列表',
      collapsed: true,
      items: yearItems,
    },
  ]
}

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
              collapsed: true,
              items: [
                { text: '0x00 环境', link: '/notes/android/00-foundation/00-environment-setup' },
                { text: '0x01 架构演进', link: '/notes/android/00-foundation/01-architecture-overview' },
                { text: '0x02 构建系统', link: '/notes/android/00-foundation/02-build-system' },
              ]
            },
            {
              text: '1 Sandbox',
              collapsed: true,
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
              collapsed: true,
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
              collapsed: true,
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
              collapsed: true,
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
              collapsed: true,
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
              collapsed: true,
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
              collapsed: true,
              items: [
                { text: 'Overview', link: '/notes/android/07-special/' },
                { text: '7x00 WebView 安全', link: '/notes/android/07-special/00-webview' },
                { text: '7x01 蓝牙安全', link: '/notes/android/07-special/01-bluetooth' },
                { text: '7x02 通信安全', link: '/notes/android/07-special/02-connectivity' },
              ]
            },
            {
              text: '8 Practical Research',
              collapsed: true,
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
        },
        {
          text: 'ARM64 Asm Essentials',
          link: '/notes/asm_essentials/',
          collapsed: false,
          items: [
            { text: '00 ARM64 基础', link: '/notes/asm_essentials/00-arm64-basics' },
            { text: '01 内存寻址', link: '/notes/asm_essentials/01-memory-addressing' },
            { text: '02 调用约定', link: '/notes/asm_essentials/02-calling-conventions' },
            { text: '03 Inline 汇编', link: '/notes/asm_essentials/03-inline-asm' },
            { text: '04 调试技巧', link: '/notes/asm_essentials/04-debugging-asm' },
            { text: '05 控制流劫持', link: '/notes/asm_essentials/05-control-flow-hijack' },
            { text: '06 内存破坏', link: '/notes/asm_essentials/06-memory-corruption' },
            { text: '07 Exploit 开发', link: '/notes/asm_essentials/07-exploit-development' },
          ]
        },
        {
          text: 'C Essentials',
          link: '/notes/c_essentials/',
          collapsed: false,
          items: [
            { text: '00 基础语法', link: '/notes/c_essentials/00-basics' },
            { text: '01 指针与内存', link: '/notes/c_essentials/01-pointers' },
            { text: '02 内存管理', link: '/notes/c_essentials/02-memory' },
            { text: '03 结构体', link: '/notes/c_essentials/03-structures' },
            { text: '04 预处理器', link: '/notes/c_essentials/04-preprocessor' },
            { text: '05 内核开发', link: '/notes/c_essentials/05-kernel-style' },
            { text: '06 驱动开发', link: '/notes/c_essentials/06-driver-dev' },
            { text: '07 KernelSU/Magisk', link: '/notes/c_essentials/07-ksu-magisk-native' },
          ]
        },
        {
          text: 'Java Essentials',
          link: '/notes/java_essentials/',
          collapsed: false,
          items: [
            { text: '00 基础语法', link: '/notes/java_essentials/00-basics' },
            { text: '01 面向对象', link: '/notes/java_essentials/01-oop' },
            { text: '02 集合框架', link: '/notes/java_essentials/02-collections' },
            { text: '03 并发编程', link: '/notes/java_essentials/03-concurrency' },
            { text: '04 JVM 与 ART', link: '/notes/java_essentials/04-jvm-art' },
            { text: '05 Smali 逆向', link: '/notes/java_essentials/05-smali' },
            { text: '06 AOSP 实战', link: '/notes/java_essentials/06-android-java' },
            { text: '07 Xposed/LSPosed', link: '/notes/java_essentials/07-xposed-lsposed' },
          ]
        },
        {
          text: 'Rust Essentials',
          link: '/notes/rust_essentials/',
          collapsed: false,
          items: [
            { text: '00 基础语法', link: '/notes/rust_essentials/00-basics' },
            { text: '01 所有权', link: '/notes/rust_essentials/01-ownership' },
            { text: '02 类型系统', link: '/notes/rust_essentials/02-types' },
            { text: '03 错误处理', link: '/notes/rust_essentials/03-error' },
            { text: '04 并发编程', link: '/notes/rust_essentials/04-concurrency' },
            { text: '05 Unsafe Rust', link: '/notes/rust_essentials/05-unsafe' },
            { text: '06 AOSP Rust', link: '/notes/rust_essentials/06-android-rust' },
            { text: '07 Magisk Rust', link: '/notes/rust_essentials/07-magisk-rust' },
          ]
        },
        {
          text: 'English Learning',
          link: '/notes/english_learning/',
          collapsed: true,
          items: [
            { text: '资源索引', link: '/notes/english_learning/resources' },
          ]
        }
      ]
    },
    {
      text: 'CVEs',
      collapsed: false,
      link: '/cves/',
      items: getCveSidebarItems()
    },
    {
      text: 'Papers',
      collapsed: false,
      link: '/papers/',
      items: []
    },
    {
      text: 'CTFs',
      collapsed: false,
      link: '/ctfs/',
      items: [
        // { text: 'BUU CTF', link: '/ctfs/buuctf/' },
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
  title: 'MilkSU Hunternote',
  description: "MilkSU's Security Research Notes",
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
    ['meta', { name: 'apple-mobile-web-app-title', content: '笨蛋笔记' }],

    // SEO meta tags
    ['meta', { name: 'keywords', content: 'milksu, starneko, 牛奶猫, security, CTF, RE, writeup, Android security, kernel exploitation, 系统安全, 安全研究' }],
    ['meta', { name: 'author', content: 'milksu, starneko, 牛奶猫' }],
    ['meta', { name: 'description', content: 'MilkSU Hunternote - milksu / starneko 的系统安全研究笔记与 Writeup。包含 CTF、RE、Android 安全、内核利用等内容。' }],

    // Other meta tags
    ['link', { rel: 'stylesheet', href: '/custom.css' }],
    ['link', { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }],
    ['link', { rel: 'canonical', href: 'https://milksu.org' }],

    // Open Graph meta tags
    ['meta', { property: 'og:title', content: 'MilkSU Hunternote - milksu / starneko' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://milksu.org' }],
    ['meta', { property: 'og:image', content: 'https://milksu.org/img/Milk.jpg' }],
    ['meta', { property: 'og:site_name', content: 'MilkSU Hunternote' }],
    ['meta', { property: 'og:description', content: 'MilkSU 的系统安全研究笔记 - System Security Hunter. Python/Go/Rust. MSCS at CU Boulder.' }],

    // Twitter Card meta tags
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@MilkSU_Official' }],
    ['meta', { name: 'twitter:creator', content: '@MilkSU_Official' }],
    ['meta', { name: 'twitter:title', content: 'MilkSU Hunternote - milksu / starneko' }],
    ['meta', { name: 'twitter:description', content: 'MilkSU 的系统安全研究笔记 - System Security Hunter' }],
    ['meta', { name: 'twitter:image', content: 'https://milksu.org/img/Milk.jpg' }],

    // JSON-LD structured data for better SEO
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'milksu',
      alternateName: ['starneko', '牛奶猫', 'MilkSU'],
      url: 'https://milksu.org',
      image: 'https://milksu.org/img/Milk.jpg',
      sameAs: [
        'https://github.com/MilkSU-Official',
        'https://x.com/MilkSU_Official',
        'https://t.me/StarNekOvO'
      ],
      jobTitle: 'Security Researcher',
      description: 'System Security Hunter. Python/Go/Rust developer. MSCS at CU Boulder.',
      knowsAbout: ['Security Research', 'CTF', 'PWN', 'Android Security', 'Kernel Exploitation']
    })],
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MilkSU Hunternote',
      alternateName: ['milksu notes', 'starneko notes', 'MilkSU Blog'],
      url: 'https://milksu.org',
      description: 'MilkSU 的系统安全研究笔记与 Writeup',
      author: {
        '@type': 'Person',
        name: 'MilkSU',
        alternateName: ['starneko', '牛奶猫', '御坂晚', 'MilkSU'],
      },
      inLanguage: 'zh-CN'
    })],
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
      {
        text: 'Tools',
        items: [
          { text: 'RzWeb <span style="font-size: 0.65em; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 500;">Binary RE</span>', link: 'https://re.milksu.org/' },
          { text: 'CyberChef <span style="font-size: 0.65em; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 500;">Misc</span>', link: 'https://misc.milksu.org/' },
          { text: '图片工具 <span style="font-size: 0.65em; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 500;">NEW</span>', link: '/tools/image-tools' },
          { text: '编码解码', link: '/tools/encoder' },
          { text: '进制转换', link: '/tools/base-converter' },
          { text: '哈希计算', link: '/tools/hash' },
          { text: '时间戳转换', link: '/tools/timestamp' },
          { text: 'IP/CIDR 计算器', link: '/tools/ip-calculator' },
          { text: 'PWN 辅助', link: '/tools/pwn-helper' },
          { text: '正则测试', link: '/tools/regex' },
        ]
      },
      { text: 'Links', link: '/links/' },
      { text: 'whoami', link: '/whoami/' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/MilkSU-Official' },
      { icon: 'twitter', link: 'https://x.com/MilkSU_Official' },
      { icon: 'telegram', link: 'https://t.me/StarNekOvO' },
    ],

    footer: {
      message: '',
      copyright: '<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;vertical-align:middle;"><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" style="height:14px" alt="CC"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" style="height:14px" alt="BY"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" style="height:14px" alt="NC"></a> · © milksu (starneko)'
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
      '/tools/': [],
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
    lineNumbers: true,
    languageAlias: {
      'nasm': 'asm',
      'smali': 'java',
      'blueprint': 'json'
    }
  },

  vite: {
    optimizeDeps: {
      exclude: ['wasm_tools']
    },
    build: {
      target: 'esnext'
    },
    server: {
      fs: {
        allow: ['.']
      }
    }
  }
})
