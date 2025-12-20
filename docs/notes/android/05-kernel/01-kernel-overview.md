# 5x00 - Android Kernel Overview

Android 内核虽然基于 Linux LTS (Long Term Support)，但为了适配移动设备的特殊需求，引入了许多特有的改动。

从安全研究视角，Android 内核可以分成三块：

- **上游 Linux 基础能力**：内存管理、调度、VFS、网络栈
- **Android 特有/强化能力**：Binder、LMKD/内存管理策略、部分安全特性集成
- **厂商驱动与定制**：SoC/外设驱动、显示/相机/基带相关，漏洞与差异最大的部分

## 1. Android 特有内核组件
- **Binder**: 核心 IPC 驱动，负责进程间通信。
- **Ashmem (Anonymous Shared Memory)**: 匿名共享内存，支持内存回收机制。
- **Low Memory Killer (LMK)**: 在内存不足时，根据 OOM Score 杀死进程。
- **Energy Aware Scheduling (EAS)**: 优化能效比的调度算法。

补充说明：

- Ashmem 在新系统上逐步由 `memfd` 等主线机制替代，但遗留兼容仍可能存在。
- LMK 在 Android 上常与用户态守护进程（LMKD）协作，策略层与内核层共同影响进程生存。

## 2. GKI (Generic Kernel Image)
从 Android 12 开始，Google 对发布时搭载 5.10+ 内核的新设备逐步落地并要求使用 GKI，以缓解内核碎片化问题。
- **核心思想**: 将核心内核与供应商驱动（Vendor Modules）分离。
- **安全意义**: Google 可以直接推送内核安全补丁，而无需等待 OEM 厂商适配。

补充：实际能否“直接推补丁”取决于设备的 ACK/GKI/KMI 约束与厂商模块情况；研究/复现时仍需以目标设备的内核分支与补丁级别为准。

## 3. Android 内核的“分区化”现实

即使 GKI 推进，安全研究仍然需要面对：

- 同一 Android 版本在不同机型上，vendor module 差异很大
- 漏洞往往集中在驱动与 ioctl 接口，而非主线通用代码

因此复现/验证时，必须明确：

- 目标设备内核版本与补丁级别
- 是否使用 GKI、是否加载特定 vendor 模块

## 4. 调试与观测

### 4.1 快速确认内核版本与构建信息

- `adb shell uname -a`
- `adb shell cat /proc/version`

### 4.2 内核日志与事件

- `adb shell dmesg | head`
- `adb logcat -b kernel`（是否可用取决于设备与权限）

### 4.3 常见接口面盘点

- `/proc`：进程、内存、调度等状态
- `/sys`：设备、驱动、cgroup、调参接口
- `/dev`：设备节点（驱动 ioctl 的入口）

## 5. 审计 checklist

1. 设备节点权限与 SELinux 标签是否合理（是否存在异常可写设备）
2. 驱动 ioctl 是否对调用方进行能力/权限校验
3. 用户态到内核态的数据结构拷贝是否严格检查长度与指针
4. 竞态风险点：引用计数、生命周期、锁顺序

## 参考（AOSP）

- https://source.android.com/docs/core/architecture/kernel — AOSP 内核分层与术语（ACK/GKI/KMI）的官方入口，用于对齐“研究对象到底是哪一层”。
- https://source.android.com/docs/core/architecture/kernel/generic-kernel-image — GKI 的目标、KMI 稳定性与版本要求，用于校对“GKI 能解决什么/不能解决什么”。
- https://source.android.com/docs/security/overview/kernel-security — AOSP 从安全角度对内核攻击面与缓解方向的官方综述入口。
