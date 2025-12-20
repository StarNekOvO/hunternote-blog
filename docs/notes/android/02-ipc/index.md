# Part 2: IPC Mechanisms

在 Android 沙箱体系中，进程间通信（IPC）是打破隔离、实现协作的唯一合法途径。对于安全研究员来说，IPC 接口是应用和系统服务最主要的**攻击面**。

## 1. 为什么 IPC 是核心攻击面？

由于沙箱的存在，攻击者通常无法直接访问敏感数据或硬件。他们必须通过 IPC 向高权限进程（如 `system_server` 或各种 HAL 服务）发送请求。如果这些请求的处理逻辑存在漏洞，攻击者就能实现提权（Privilege Escalation）。

## 2. 专题章节

在本专题中，我们将深入探讨 Android 的各种通信机制，从底层的 Binder 驱动到上层的 Intent 路由：

### [2x00 - Binder 深度解析](./01-binder-deep-dive.md)
- **核心内容**: Binder 驱动原理、ServiceManager、死亡通知、安全校验机制（UID/PID）。
- **CVE 案例**: CVE-2019-2215 (Bad Binder)。

### [2x01 - Intent 系统安全](./02-intent-system.md)
- **核心内容**: 显式与隐式 Intent、Intent Filter 匹配算法、PendingIntent 的陷阱。
- **CVE 案例**: Intent 重定向漏洞、PendingIntent 提权。

### [2x02 - HIDL 与 AIDL (Treble 架构)](./03-hidl-aidl.md)
- **核心内容**: Project Treble 后的 HAL 演进、hwbinder 与 vnbinder、接口定义语言。
- **CVE 案例**: HAL 进程中的内存破坏漏洞。

### [2x03 - 其他 IPC 机制](./04-other-ipc.md)
- **核心内容**: Unix Domain Sockets、匿名共享内存 (ashmem/memfd)、Pipes。
- **CVE 案例**: Socket 权限配置不当导致的信息泄露。

## 参考（AOSP）

- 架构概览（系统服务/原生守护进程/库层级定位）：https://source.android.com/docs/core/architecture
- AIDL 概览（平台 IPC 抽象，含 service/dumpsys 交互入口）：https://source.android.com/docs/core/architecture/aidl
- HIDL（Android 10 起废弃、迁移到 AIDL 的官方口径）：https://source.android.com/docs/core/architecture/hidl
- SELinux（IPC 接口的 allow/connectto 等策略约束背景）：https://source.android.com/docs/security/features/selinux
