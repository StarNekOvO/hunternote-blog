<template>
  <div class="ba-hero">
    <div class="ba-hero-bg">
      <img v-if="hasBgImage" :src="isDark ? bgDark : bgLight" alt="" class="bg-img" @error="hasBgImage = false" />
      <div class="bg-overlay"></div>
    </div>
    <div 
      class="ba-hero-content"
      ref="contentRef"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      :style="{ transform: `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)` }"
    >
      <div class="welcome-text">{{ welcomeText }}</div>
      <div 
        class="info-card"
        :style="{ background: `linear-gradient(${gradientAngle}deg, var(--card-bg-start), var(--card-bg-end))` }"
      >
        <img :src="avatar" alt="avatar" class="avatar" @dragstart.prevent />
        <div class="name">{{ name }}</div>
        <div class="alias">{{ alias }}</div>
        <div class="motto">
          <span>{{ displayMotto }}</span>
          <span class="cursor"></span>
        </div>
        <div class="social-links">
          <a v-for="link in socialLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" :title="link.name">
            <component :is="link.icon" class="social-icon" />
          </a>
        </div>
        <div class="nav-links">
          <a :href="primaryAction.link">{{ primaryAction.text }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const hasBgImage = ref(true)

// 3D 视差效果
const contentRef = ref<HTMLElement | null>(null)
const rotateX = ref(0)
const rotateY = ref(0)
const gradientAngle = ref(135)
const PARALLAX_FACTOR = 15

const onMouseMove = (e: MouseEvent) => {
  if (!contentRef.value) return
  window.requestAnimationFrame(() => {
    const rect = contentRef.value!.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    rotateY.value = (e.clientX - centerX) / PARALLAX_FACTOR
    rotateX.value = -(e.clientY - centerY) / PARALLAX_FACTOR
    // 计算鼠标角度用于渐变
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    gradientAngle.value = Math.atan2(dy, dx) * (180 / Math.PI) + 90
  })
}

const onMouseLeave = () => {
  rotateX.value = 0
  rotateY.value = 0
  gradientAngle.value = 135
}

// Props with defaults
const props = withDefaults(defineProps<{
  welcomeText?: string
  name?: string
  alias?: string
  motto?: string
  avatar?: string
  bgLight?: string
  bgDark?: string
  primaryAction?: { text: string; link: string }
  secondaryAction?: { text: string; link: string }
}>(), {
  welcomeText: 'Hunternote',
  name: 'MilkSU',
  alias: 'starneko',
  motto: 'System Security Hunter. Python/Go/Rust.\nMSCS at CU Boulder. Freelancer.\nヨルシカ ◂Ⓘ▸ maimaiDX',
  avatar: '/img/Milk.jpg',
  bgLight: '/img/banner-light.webp',
  bgDark: '/img/banner-dark.webp',
  primaryAction: () => ({ text: 'LINK START', link: '/notes/' }),
  secondaryAction: () => ({ text: 'whoami', link: '/whoami/' }),
})

// 打字机效果
const displayMotto = ref('')
let charIndex = 0

const typeWriter = () => {
  if (charIndex < props.motto.length) {
    displayMotto.value += props.motto[charIndex]
    charIndex++
    setTimeout(typeWriter, Math.random() * 60 + 60)
  }
}

// 社交链接图标
const GithubIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' })
])

const TwitterIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' })
])

const TelegramIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' })
])

const socialLinks = [
  { icon: GithubIcon, url: 'https://github.com/MilkSU-Official', name: 'GitHub' },
  { icon: TwitterIcon, url: 'https://x.com/MilkSU_Official', name: 'X' },
  { icon: TelegramIcon, url: 'https://t.me/StarNekOvO', name: 'Telegram' },
]

onMounted(() => {
  setTimeout(typeWriter, 500)
})
</script>

<style scoped>
.ba-hero {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  --card-bg-start: rgba(255, 255, 255, 0.7);
  --card-bg-end: rgba(240, 248, 255, 0.6);
}

:root.dark .ba-hero {
  --card-bg-start: rgba(30, 30, 50, 0.7);
  --card-bg-end: rgba(40, 35, 60, 0.6);
}

.ba-hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(135deg, #e8f4fc 0%, #f0e6fa 50%, #fce4ec 100%);
}

:root.dark .ba-hero-bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%);
}

.bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  position: absolute;
  inset: 0;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: transparent;
}

:root.dark .bg-overlay {
  background: transparent;
}

.ba-hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  z-index: 1;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

.welcome-text {
  font-size: clamp(1.8rem, 5vw, 3.5rem);
  font-weight: 700;
  color: #2c3e50;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  text-align: center;
  letter-spacing: 0.05em;
  user-select: none;
}

:root.dark .welcome-text {
  color: #e8e8e8;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.info-card {
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 24px;
  padding: 3.5rem 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  max-width: 380px;
  width: 90%;
  position: relative;
  margin-top: 50px;
  transition: background 0.3s ease;
}

:root.dark .info-card {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  position: absolute;
  top: -48px;
  cursor: pointer;
  object-fit: cover;
  z-index: 1;
}

/* SSR 彩色光环容器 */
.info-card::before {
  content: '';
  position: absolute;
  top: -52px;
  left: 50%;
  transform: translateX(-50%);
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #7dd3fc,
    #93c5fd,
    #a5b4fc,
    #c4b5fd,
    #e9d5ff,
    #fce7f3,
    #fbcfe8,
    #e9d5ff,
    #c4b5fd,
    #a5b4fc,
    #93c5fd,
    #7dd3fc,
    #93c5fd,
    #a5b4fc,
    #c4b5fd,
    #e9d5ff,
    #fce7f3,
    #fbcfe8,
    #e9d5ff,
    #c4b5fd,
    #a5b4fc,
    #93c5fd,
    #7dd3fc
  );
  animation: ssr-rotate 3s linear infinite;
  z-index: 0;
}

/* 内层遮罩 */
.info-card::after {
  content: '';
  position: absolute;
  top: -48px;
  left: 50%;
  transform: translateX(-50%);
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--card-bg-start);
  z-index: 0;
}

@keyframes ssr-rotate {
  from {
    transform: translateX(-50%) rotate(0deg);
  }
  to {
    transform: translateX(-50%) rotate(360deg);
  }
}

/* 外发光效果 */

.info-card::before {
  box-shadow: 
    0 0 20px rgba(96, 165, 250, 0.5),
    0 0 40px rgba(255, 255, 255, 0.4),
    0 0 60px rgba(244, 114, 182, 0.3);
  animation: ssr-rotate 3s linear infinite, ssr-glow 2s ease-in-out infinite alternate;
}

@keyframes ssr-glow {
  from {
    box-shadow: 
      0 0 20px rgba(96, 165, 250, 0.5),
      0 0 40px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(244, 114, 182, 0.3);
  }
  to {
    box-shadow: 
      0 0 30px rgba(244, 114, 182, 0.5),
      0 0 50px rgba(255, 255, 255, 0.5),
      0 0 70px rgba(96, 165, 250, 0.4);
  }
}

.avatar:hover {
  transform: rotate(360deg) scale(1.08);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:root.dark .avatar {
  border: none;
}

.name {
  font-size: 1.6rem;
  font-weight: 600;
  margin-top: 1.2rem;
  color: #1a1a1a;
  letter-spacing: 0.02em;
}

:root.dark .name {
  color: #f0f0f0;
}

.alias {
  font-size: 1rem;
  color: #999;
  margin-top: 0.2rem;
  letter-spacing: 0.01em;
}

:root.dark .alias {
  color: #777;
}

.motto {
  font-size: 0.9rem;
  color: #555;
  margin-top: 0.6rem;
  text-align: center;
  min-height: 1.4em;
  line-height: 1.5;
  max-width: 300px;
  white-space: pre-line;
}

:root.dark .motto {
  color: #aaa;
}

.motto .cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.social-links {
  display: flex;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.social-links a {
  color: #666;
  transition: all 0.25s ease;
  display: flex;
  padding: 6px;
  border-radius: 8px;
}

.social-links a:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

:root.dark .social-links a {
  color: #999;
}

:root.dark .social-links a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.social-icon {
  width: 22px;
  height: 22px;
}

.nav-links {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-links a {
  color: #4a7c9b;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}

.nav-links a:hover {
  color: #2d5a7b;
  text-decoration: underline;
}

:root.dark .nav-links a {
  color: #8bb8d0;
}

:root.dark .nav-links a:hover {
  color: #b8d4e8;
}

@media (max-width: 640px) {
  .info-card {
    padding: 3rem 1.5rem 1.5rem;
  }
  .avatar {
    width: 80px;
    height: 80px;
    top: -40px;
  }
  /* 移动端调整彩色光环尺寸 */
  .info-card::before {
    top: -44px;
    width: 88px;
    height: 88px;
  }
  /* 移动端调整内层遮罩尺寸 */
  .info-card::after {
    top: -40px;
    width: 80px;
    height: 80px;
  }
  .name {
    margin-top: 1rem;
  }
}
</style>
