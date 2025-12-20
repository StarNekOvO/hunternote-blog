# 5x04 - Android Virtualization Framework (AVF)

AVF 是 Android 13 引入的新特性，旨在提供比进程沙箱更强的隔离。

与传统“进程隔离”相比，虚拟化隔离的关键收益在于：

- 隔离边界从“同一内核下的 domain”提升到“不同虚拟机上下文”
- 内核被攻破后的横向扩展难度上升（取决于虚拟化层实现）

## 1. 核心组件
- **pKVM (Protected KVM)**: 受保护的虚拟机管理器。
- **Microdroid**: 一个精简的 Android 操作系统，运行在隔离的虚拟机中。

补充几个概念层组件：

- **Hypervisor 模式与隔离内存**：为 guest 提供独立的物理内存视图
- **设备虚拟化/半虚拟化**：尽量减少复杂设备面在 guest 的暴露
- **受控通信通道**：host 与 guest 的 IPC/共享内存需要更严格的边界

## 2. 安全意义
- **隔离敏感计算**: 将生物识别、密钥处理等逻辑从主系统剥离。
- **防止内核提权**: 即使主系统内核被攻破，攻击者也无法轻易跨越虚拟机边界访问 pKVM 保护的数据。

更细化的威胁模型理解：

- 目标不是“消灭漏洞”，而是把高价值资产放到更难触达的域
- 仍需面对 guest 内部漏洞、host/guest 通信面漏洞、以及虚拟化层本身漏洞

## 3. 典型使用场景

- 高价值密钥与加密操作
- 生物识别相关逻辑
- 需要处理不可信输入但希望更强隔离的组件

## 4. 研究与排查切入点

### 4.1 边界面（host/guest 交互）

- guest 暴露的接口集合
- 共享内存/虚拟设备的数据契约
- 权限与身份如何在边界上传递

### 4.2 日志与状态

不同实现与版本差异较大，但排查思路一致：

- 确认组件是否运行在 microdroid/VM 内
- 观察 host 与 guest 两侧日志

## 5. 关联阅读

- `/notes/android/06-hardware/02-arm-cca`（CCA/RME 与更强隔离模型的关联）

## 参考（AOSP）
- https://source.android.com/docs/core/virtualization — AVF 总览与关键组件术语（pKVM、Microdroid、VirtualizationService 等）。
- https://source.android.com/docs/core/virtualization/whyavf — AVF 的需求背景与“为何需要比应用沙盒更强隔离”的动机说明。
- https://source.android.com/docs/core/virtualization/microdroid — Microdroid 的定位与运行形态说明。
