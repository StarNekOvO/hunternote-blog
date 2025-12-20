# Part 5: Kernel Security

Android 内核基于 Linux，但增加了许多特有的驱动（如 Binder, Ashmem）和安全增强（如 SELinux）。

## 1. 专题章节

在本专题中，我们将深入探讨 Android 的内核安全机制：

### [5x00 - Android Kernel Overview](./01-kernel-overview.md)
- **核心内容**: 内核架构、Android 特有驱动（Binder, Ashmem）、GKI 计划。

### [5x01 - SELinux on Android](./02-selinux.md)
- **核心内容**: 强制访问控制（MAC）原理、策略审计、MLS 隔离。

### [5x02 - Kernel Attack Surface](./03-attack-surface.md)
- **核心内容**: 系统调用、驱动程序漏洞、Binder 驱动安全。

### [5x03 - Kernel Mitigations](./04-mitigations.md)
- **核心内容**: KASLR, PAN, PXN, CFI, MTE 等硬件与软件保护。

### [5x04 - Android Virtualization Framework (AVF)](./05-avf.md)
- **核心内容**: pKVM 架构、Microdroid 隔离。

### [5x05 - Kernel Exploitation Techniques](./06-exploitation.md)
- **核心内容**: 内核提权实战、数据流攻击思路。

## 参考（AOSP）
- https://source.android.com/docs/core/architecture/kernel — Android 内核/ACK/GKI 的官方入口。
- https://source.android.com/docs/security/overview/kernel-security — Android 内核安全总览入口。
