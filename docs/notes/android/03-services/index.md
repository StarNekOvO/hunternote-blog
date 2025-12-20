# Part 3: System Services

在 Android 中，大部分核心功能（如安装应用、启动 Activity、管理窗口）都不是由应用自己完成的，而是通过 IPC 请求 **System Services** 来实现的。这些服务大多运行在 `system_server` 进程中。

## 1. 为什么系统服务是核心攻击面？

1.  **高权限**：`system_server` 拥有极高的权限（UID 1000, system），可以访问几乎所有的硬件和敏感数据。
2.  **逻辑复杂**：AMS、PMS 等服务包含数百万行 Java 代码，逻辑极其复杂，容易出现状态机错误或权限校验漏洞。
3.  **跨进程交互**：所有应用都能通过 Binder 与这些服务通信，提供了巨大的攻击入口。

## 2. 专题章节

### [3x00 - system_server 架构](./01-system-server.md)
- **核心内容**: system_server 的启动流程、服务注册机制、JNI 边界。

### [3x01 - ActivityManagerService (AMS)](./02-ams.md)
- **核心内容**: 进程管理、Activity 栈劫持、Intent 转发逻辑。

### [3x02 - PackageManagerService (PMS)](./03-pms.md)
- **核心内容**: APK 安装校验、权限授予逻辑、签名验证漏洞。

### [3x03 - WindowManagerService (WMS)](./04-wms.md)
- **核心内容**: 窗口层级管理、悬浮窗攻击（Overlay Attack）。

### [3x04 - Media Framework](./05-media-framework.md)
- **核心内容**: 媒体解析服务的沙箱化、Stagefright 历史漏洞。

## 参考（AOSP）

- 架构概览（系统服务、system_server、原生守护进程层级）：https://source.android.com/docs/core/architecture
- AIDL 概览（平台 IPC 抽象，对照 service/dumpsys）：https://source.android.com/docs/core/architecture/aidl
- 应用签名（签名方案 v1/v2/v3/v4、shared UID 废弃口径）：https://source.android.com/docs/security/features/apksigning
- 媒体（Stagefright/媒体模块/强化）：https://source.android.com/docs/core/media
