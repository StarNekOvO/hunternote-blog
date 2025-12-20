# 6x01 - ARM CCA (Confidential Compute Architecture)

ARM CCA 是 ARMv9 引入的机密计算架构，核心目标是在不假设更高权限软件层完全可信的前提下提供更强的隔离。

CCA 的核心变化是：在传统的 REE/TEE/Hypervisor 模型之外，引入一种更强的隔离域，使得即使是更高权限的软件层也无法直接窥视某些隔离域内的数据。

## 1. Realm Management Extension (RME)
- **核心思想**: 引入 **Realm** 概念，即使是 Hypervisor 或 TEE 也无法访问 Realm 内部的数据。
- **动态内存隔离**: 内存可以在不同安全状态间动态转换。

补充：RME 的关键点在于“内存归属状态”的转换与硬件强制约束。

- 某段物理内存可以在不同安全状态间转换
- 状态转换需要硬件参与与验证
- 目标是降低“管理者可见性”（hypervisor/host 不再天然可读 guest 机密内存）

## 2. 对 Android 的影响
- 进一步增强了 AVF (Android Virtualization Framework) 的安全性。
- 实现了真正的“机密虚拟机”。

## 3. 与 TrustZone/AVF 的关系

- **TrustZone/TEE**：更像“可信执行环境”，目标是保护敏感服务与密钥
- **CCA Realm**：更像“机密计算隔离域”，目标是让上层管理者也难以读取机密
- **AVF**：在 Android 上提供虚拟化隔离的框架，未来可与 CCA/RME 结合提升隔离强度

## 4. 研究视角的关注点

### 4.1 边界面仍然存在

即使隔离更强，仍然存在可被攻击的边界：

- host/realm 的通信协议与共享缓冲区
- 虚拟设备与半虚拟化接口
- 引导与测量链路（谁证明 realm 的软件栈可信）

### 4.2 工程落地的差异

CCA 的落地依赖：

- SoC 是否支持 ARMv9/RME
- 系统软件栈是否完整实现
- 设备厂商是否启用并正确配置

因此同一 Android 版本在不同设备上的实际能力可能差异很大。

## 5. 关联阅读

- `/notes/android/05-kernel/05-avf`
- `/notes/android/06-hardware/01-trustzone`

## 参考（AOSP）
- https://source.android.com/docs/core/virtualization — AVF/pKVM/Microdroid 的官方入口（CCA/RME 属于底层硬件能力，AOSP 文档更多从 AVF 视角描述隔离形态）。
- https://source.android.com/docs/security/features — Android 平台安全功能总览入口（用于把“硬件隔离能力”放到平台安全模型中对齐）。
