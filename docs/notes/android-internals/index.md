# Android Internals

Android 系统核心架构与底层运行机制分析, 从 Userland 到 Kernel 边界 (不包含 App 和 Linux Kernel)

## Java Framework & System Services
应用层与系统服务 (注: 逻辑漏洞、权限绕过)

- **系统启动链路**： Init (Native) -> Zygote (孵化器) -> SystemServer (系统服务总管)
- **核心服务管理**： AMS (Activity管理), WMS (窗口管理), PMS (包管理)
- **消息驱动模型**： Handler / Looper / MessageQueue 机制分析

## Runtime & IPC (Native Layer)
原生运行时与通信桥梁 (注: Userland Pwn 重点)

- **Binder 机制**： ServiceManager 原理、ioctl 驱动交互、User/Kernel 内存映射
- **数据结构**： Parcel 序列化结构与对象生命周期
- **运行时环境**： ART 虚拟机原理、ELF 文件格式解析、Linker 动态链接机制 (GOT/PLT)

## Kernel Interfaces & HAL
内核边界与硬件抽象 (注: Kernel Pwn 入口)

- **硬件抽象层**： HAL (Hardware Abstraction Layer) 加载与交互原理
- **Android 特有内核机制**：
  - **Memory**: Ashmem (匿名共享内存), LowMemoryKiller (LMK)
  - **Driver**: Binder Driver (内核态实现), Logger
