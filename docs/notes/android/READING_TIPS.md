# Android 4.x 书籍 → 现代 Android 的差异警示

**内部参考文档**：本文件用于对比《Android Hacker's Handbook》等早期资料与现代 Android (12-16) 的核心差异，避免学习路径偏离。

## 🔴 完全过时，需要重新学习

| 书中内容 | Android 4.x 时代 | 现代 Android (12-16) | 影响章节 |
|----------|------------------|---------------------|----------|
| **Dalvik VM** | 默认运行时 | 已废弃，替换为 ART | 4x03 |
| **SELinux** | Permissive 或部分 Enforcing | 全面 Enforcing，策略极其复杂 | 5x01 |
| **seccomp** | 不存在 | 强制启用，syscall 白名单 | 4x02 |
| **存储权限** | 全局可读写 /sdcard | Scoped Storage，严格隔离 | 1x03 |
| **权限模型** | 安装时一次性授予 | 运行时权限 + 细粒度控制 | 1x02 |
| **WebView** | 系统内置，不隔离 | 独立进程，沙箱隔离 | 7x00 |
| **mediaserver** | 单一进程，权限巨大 | 分离为多个低权限进程 | 3x05 |
| **Verified Boot** | 基本或无 | AVB 2.0，强制启用 | 6x02 |
| **内核缓解** | 基本 ASLR | KASLR + CFI + PAC + MTE + ... | 5x03 |

## 🟡 核心概念不变，但实现细节变化大

| 书中内容 | 需要注意的变化 | 影响章节 |
|----------|---------------|----------|
| **UID/GID 隔离** | 概念相同，但 AID 范围扩展、多用户支持增强 | 1x00 |
| **Zygote** | 核心机制相同，但增加了 App Zygote、WebView Zygote | 1x01 |
| **Binder** | 用户空间实现类似，但内核驱动有重大安全修复 | 2x00 |
| **签名验证** | V1 签名机制可参考，但现在有 V2/V3/V4 | 3x02 |
| **init / rc 文件** | 语法类似，但服务定义和权限大不同 | 4x04 |
| **bootloader** | 概念相同，但 AVB 2.0 完全不同 | 6x02 |

## 🟢 仍然有效，可以直接学习

| 书中内容 | 为什么仍然有效 | 影响章节 |
|----------|---------------|----------|
| **Linux 进程/权限基础** | Unix 基础不变 | 1x00 |
| **Binder 协议概念** | 协议设计未变 | 2x00 |
| **Intent 机制** | 核心设计相同 | 2x01 |
| **四大组件概念** | Activity/Service/BR/CP 基础相同 | 1x04 |
| **APK 结构** | 基本结构相同 | 3x02 |
| **调试思路** | gdb/逆向方法论通用 | 8x01 |
| **漏洞研究方法论** | Fuzzing/审计思路通用 | 8x00 |

## 按章节的具体警示

### Part 1: Application Sandbox

```
📖 书中: "应用数据存储在 /data/data/<package>，其他应用无法访问"
✅ 仍然正确

📖 书中: "应用可以自由访问 /sdcard"
❌ 错误! Android 10+ Scoped Storage 完全改变了这点

📖 书中: "权限在安装时授予"
❌ 错误! Android 6.0+ 运行时权限

📖 书中: SharedUserId 使用示例
⚠️ 已废弃，Android 不再推荐，但概念可以了解
```

### Part 2: IPC (Binder)

```
📖 书中: Binder 驱动源码分析
⚠️ 路径变了: drivers/staging/android/ → drivers/android/
⚠️ 代码有大量安全修复，书中的漏洞模式大多已修复

📖 书中: ServiceManager 实现
⚠️ 有变化，但核心概念相同

📖 书中: Parcel 序列化
✅ 基本相同，可以学习
```

### Part 3: System Services

```
📖 书中: mediaserver 架构
❌ 完全过时! Android 7.0 后分离为多个进程
   - mediaserver → mediaextractor + mediacodec + mediadrmserver + ...
   - 书中的攻击面分析需要完全重做

📖 书中: system_server 权限
⚠️ 概念相同，但 SELinux 限制了大量行为

📖 书中: PMS 签名验证
⚠️ V1 签名部分可参考，但需要补充 V2/V3/V4
```

### Part 4: Native Layer

```
📖 书中: Dalvik 虚拟机内部
❌ 完全废弃! 现在是 ART
   - 不要在 Dalvik 上花时间
   - 直接学习 ART

📖 书中: dlmalloc 堆利用
❌ 过时! 
   - Android 5: jemalloc
   - Android 11+: Scudo hardened allocator
   - 书中的堆利用技术大多不适用

📖 书中: 没有提到 seccomp
❌ 必须补充! Android 7.0+ 强制 seccomp-bpf

📖 书中: Bionic libc
⚠️ 概念相同，但安全特性大幅增强
```

### Part 5: Kernel

```
📖 书中: SELinux 是可选的或 permissive
❌ 完全错误! 现在是强制 enforcing

📖 书中: 内核利用技术
⚠️ 很多技术已被缓解:
   - addr_limit 攻击 → 已修复
   - 直接改 cred → CFI/PAC 增加难度
   - 堆喷射 → KFENCE/MTE 检测

📖 书中: 没有提到的
❌ 必须补充:
   - GKI (Generic Kernel Image)
   - pKVM / AVF
   - ARM CCA
   - MTE
```

### Part 6: Hardware

```
📖 书中: TrustZone 基础
✅ 概念仍然有效

📖 书中: 没有提到的
❌ 必须补充:
   - pKVM (替代部分 TrustZone 场景)
   - ARM CCA / Realm
   - StrongBox
   - Titan M
```

## 学习建议

### 读书时的心态

```
把 Android 4.x 的书当作:
├── ✅ 学习"设计理念"和"为什么这样设计"
├── ✅ 理解基础概念 (UID, Binder 协议, Intent)
├── ⚠️ 实现细节需要对照现代 AOSP 验证
└── ❌ 不要直接复制书中的利用技术
```

### 推荐学习顺序

```
1. 先读书，理解概念框架
              ↓
2. 对照 source.android.com 文档看现代实现
              ↓
3. 读最近 1-2 年的 Android Security Bulletin
              ↓
4. 分析现代 CVE (2023-2025) 的 patch
              ↓
5. 在真机/模拟器上验证
```

### 必须额外学习的内容（书中没有）

| 主题 | 重要性 | 资源 |
|------|--------|------|
| ART 内部 | 🔴 高 | AOSP `art/` 目录 |
| SELinux Policy | 🔴 高 | `system/sepolicy/` |
| seccomp-bpf | 🔴 高 | `bionic/libc/seccomp/` |
| Scoped Storage | 🟡 中 | Android 开发者文档 |
| AVF/pKVM | 🔴 高 | `packages/modules/Virtualization/` |
| GKI | 🟡 中 | Android 内核文档 |
| MTE | 🟡 中 | ARM 文档 + Google 博客 |

## 一句话总结

书中的“为什么”仍然有价值，但“怎么做”需要结合现代系统重新验证。

重点差异：Dalvik→ART、无 SELinux→强制 SELinux、无 seccomp→强制 seccomp；这些变化会使早期书中的大量攻击路径不再成立。

## 参考（AOSP）

- 现代实现对照入口：https://source.android.com/docs
- 架构概览：https://source.android.com/docs/core/architecture
- 应用沙盒（含 UID/DAC、SELinux 隔离演进、seccomp 相关描述）：https://source.android.com/docs/security/app-sandbox
- SELinux（含 enforcing/permissive、Treble 相关影响）：https://source.android.com/docs/security/features/selinux
- Verified Boot / AVB：https://source.android.com/docs/security/features/verifiedboot
- 月度安全公告（ASB）：https://source.android.com/docs/security/bulletin
- 构建与版本生命周期：https://source.android.com/docs/setup/build
