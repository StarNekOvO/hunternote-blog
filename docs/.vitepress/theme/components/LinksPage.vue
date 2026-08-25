<template>
  <div class="links-page">
    <!-- 顶部区域 -->
    <div class="links-header">
      <!-- 切换按钮 -->
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'carousel' }" @click="viewMode = 'carousel'" title="滚动视图">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l4-4 4 4M8 16l4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="网格视图">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 滚动模式 -->
    <FriendsCarousel v-if="viewMode === 'carousel'" :friends="displayedFriends" />

    <!-- 卡片模式 -->
    <div v-else class="friends-grid">
      <FriendCard
        v-for="friend in displayedFriends"
        :key="friend.link"
        :name="friend.name"
        :link="friend.link"
        :avatar="friend.avatar"
        :desc="friend.desc"
        :social-links="friend.socialLinks"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FriendCard from './FriendCard.vue'
import FriendsCarousel from './FriendsCarousel.vue'

const viewMode = ref('carousel')

const friends = [
  {
    name: 'SorrowRain的小窝',
    link: 'https://0xsr.dev/',
    avatar: 'https://0xsr.dev/avatar-fixed.jpeg',
    desc: '关于生活、思考、随笔以及碎碎念',
    socialLinks: [
      { type: 'github', url: 'https://github.com/sorrowrain', name: 'GitHub' },
      { type: 'twitter', url: 'https://x.com/0xSorrowRain', name: 'Twitter' },
      { type: 'telegram', url: 'https://t.me/SorrowRain', name: 'Telegram' }
    ]
  },
  {
    name: 'ZianTT',
    link: 'https://ziantt.top/',
    avatar: 'https://ziantt.top/_astro/avatar.rremnUwR.jpg',
    desc: 'KEEP LOVING, KEEP LIVING',
    socialLinks: [
      { type: 'github', url: 'https://github.com/ZianTT', name: 'GitHub' },
      { type: 'twitter', url: 'https://twitter.com/ZianTT_Official', name: 'Twitter' }
    ]
  },
  {
    name: 'Hikaru Lab',
    link: 'https://www.mengxiblog.top/',
    avatar: 'https://img-cn.static.isla.fan/2025/10/19/68f4824b7c228.png',
    desc: 'Web Engineer / CTFer. 即使是人造的记忆，也有它存在的价值',
    socialLinks: [
      { type: 'github', url: 'https://github.com/HikaruQwQ', name: 'GitHub' }
    ]
  },
  {
    name: '编汐译梦CacheTide',
    link: 'https://www.cachetide.top',
    avatar: 'https://www.cachetide.top/favicon.jpg',
    desc: '无人相伴的路，惝恍迷离的舞',
    socialLinks: [
      { type: 'github', url: 'https://github.com/CacheTide', name: 'GitHub' },
      { type: 'bilibili', url: 'https://space.bilibili.com/159435471', name: 'Bilibili' },
      { type: 'telegram', url: 'https://t.me/Luo_yiyu', name: 'Telegram' }
    ]
  },
  {
    name: 'mintdesu',
    link: 'https://hoshiroko.com',
    avatar: 'https://api.hoshiroko.com/img/mint.jpg',
    desc: 'Yearning for companionship, longing for affection',
    socialLinks: [
      { type: 'github', url: 'https://github.com/mintdesu', name: 'GitHub' },
      { type: 'bilibili', url: 'https://space.bilibili.com/307514475', name: 'Bilibili' }
    ]
  },
  {
    name: '清凤小栈',
    link: 'https://清凤.fun',
    avatar: 'https://清凤.fun/images/logo/logo.webp',
    desc: '清凤和Kilock的温馨小屋',
    socialLinks: [
      { type: 'rss', url: 'https://清凤.fun/rss.xml', name: 'RSS' }
    ]
  },
  {
    name: 'hsn',
    link: 'https://www.zh314.xyz',
    avatar: '/img/hsn.png',
    desc: '手里两把锟斤拷，口中直呼烫烫烫',
    socialLinks: [
      { type: 'github', url: 'https://github.com/hsn8086', name: 'GitHub' },
      { type: 'twitter', url: 'https://twitter.com/hsn8086', name: 'Twitter' },
      { type: 'telegram', url: 'https://t.me/+QN71SuTbvAZlMmI1', name: 'Telegram' }
    ]
  },
  {
    name: 'CAOMEI',
    link: 'http://blog.awacat.cc',
    avatar: 'http://blog.awacat.cc/favicon.png',
    desc: '小草莓！',
    socialLinks: [
      { type: 'github', url: 'https://github.com/MinecraftYYDS', name: 'GitHub' },
      { type: 'twitter', url: 'https://x.com/wxb_NB', name: 'Twitter' },
      { type: 'telegram', url: 'https://t.me/awa_cat', name: 'Telegram' }
    ]
  },
  {
    name: '小小柳之絮',
    link: 'https://www.gymxbl.com',
    avatar: '/img/gymxbl.png',
    desc: '古之立大事者，不惟有超世之材，亦必有坚忍不拨之志',
    socialLinks: [
      { type: 'bilibili', url: 'https://space.bilibili.com/139186903', name: 'Bilibili' },
      { type: 'zhihu', url: 'https://www.zhihu.com/people/xiao-xiao-liu-zhi-xu', name: '知乎' }
    ]
  },
  {
    name: 'Xiaotian 7196',
    link: 'https://koten.top',
    avatar: 'https://koten.top/ISEKAI.png',
    desc: '无论如何，请不要后悔与我相遇',
    socialLinks: [
      { type: 'github', url: 'https://github.com/xiaotian7196', name: 'GitHub' }
    ]
  },
  {
    name: '啊不都',
    link: 'https://www.oplog.cn',
    avatar: 'https://www.google.com/s2/favicons?sz=128&domain=www.oplog.cn',
    desc: 'Qexo 开发者 / Hexo 博主',
    socialLinks: [
      { type: 'github', url: 'https://github.com/am-abudu', name: 'GitHub' }
    ]
  },
  {
    name: '水碧枫',
    link: 'https://www.crystmaple.net',
    avatar: 'https://www.crystmaple.net/images/avatar.webp',
    desc: '提拉米苏、南瓜派与红茶',
    socialLinks: [
      { type: 'github', url: 'https://github.com/CrystMaple', name: 'GitHub' },
      { type: 'bilibili', url: 'https://space.bilibili.com/1139519970', name: 'Bilibili' }
    ]
  },
  {
    name: '秋奈Akina',
    link: 'https://akinachan.com',
    avatar: '/img/10042.jpg',
    desc: ''
  },
  {
    name: '柒鸟',
    link: 'https://www.one-among.us/profile/SevenBird',
    avatar: '/img/sevenbird.jpg',
    desc: 'R.I.P.'
  },
  {
    name: 'CN059的技术博客',
    link: 'https://blog.cn059.com/',
    avatar: 'https://bu.dusays.com/2025/10/09/68e798c0a1dc6.jpg',
    desc: 'CN059 的技术博客'
  }
]

const displayedFriends = ref([...friends])

const shuffleFriends = <T,>(items: T[]) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = currentItem
  }

  return shuffled
}

// 移动端默认卡片网格，桌面端默认滚动；友链每次进入页面随机排序
onMounted(() => {
  if (window.innerWidth <= 768) {
    viewMode.value = 'grid'
  }

  displayedFriends.value = shuffleFriends(friends)
})
</script>

<style scoped>
.links-page {
  min-height: 100vh;
  padding: 100px 2rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.links-header {
  width: 100%;
  max-width: 1200px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.02em;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 3px;
  background: rgba(128, 128, 128, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.1);
}

.view-toggle button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-toggle button:hover {
  color: var(--vp-c-text-2);
}

.view-toggle button.active {
  background: rgba(128, 128, 128, 0.12);
  color: var(--vp-c-text-1);
}

:root.dark .view-toggle {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}

:root.dark .view-toggle button.active {
  background: rgba(255, 255, 255, 0.1);
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem 1.5rem;
  width: 100%;
  max-width: 1100px;
  padding-top: 48px;
}

@media (max-width: 1024px) {
  .friends-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .links-page {
    padding: 90px 1rem 3rem;
  }
  
  .friends-grid {
    grid-template-columns: 1fr;
    gap: 3.5rem 1rem;
  }
}
</style>
