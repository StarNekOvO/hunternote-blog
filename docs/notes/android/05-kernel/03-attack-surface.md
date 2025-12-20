# 5x02 - Kernel Attack Surface

内核漏洞通常对应“本地权限提升”的高风险路径。

更现实的表述是：内核是“权限最终裁决者”，一旦出现可利用漏洞，进程沙箱与 SELinux 的边界可能被突破。因此攻击面分析的目标是：把用户态可达的内核接口按风险与可控输入分类。

## 1. 主要攻击面
- **系统调用 (Syscalls)**: 用户态进入内核态的合法入口。
- **驱动程序 (Drivers)**: 尤其是第三方供应商（高通、联发科）提供的驱动，往往是漏洞重灾区。
- **Binder 驱动**: 复杂的并发逻辑和内存管理。
- **网络协议栈**: 处理不可信的外部数据包。

补充几个在 Android 上经常出现的入口类别：

- **ioctl**：大量设备驱动通过 `/dev/*` 暴露 ioctl 接口
- **netlink**：网络/内核子系统的消息通道
- **eBPF**：能力强但通常受限制；配置错误时风险高
- **文件系统接口**：特定文件系统实现与挂载参数

## 2. 漏洞类型
- **Use-After-Free (UAF)**: 释放后使用。
- **Out-of-Bounds (OOB)**: 越界读写。
- **Race Condition**: 竞争条件。
- **Integer Overflow**: 整数溢出导致缓冲区计算错误。

在内核侧，这些类型往往与“可控输入如何进入内核对象”绑定：

- copy_from_user/copy_to_user 的长度与指针
- ioctl 参数结构体的版本与大小
- 引用计数与生命周期管理
- 锁与并发路径

## 3. 攻击面枚举方法（偏实战）

### 3.1 设备节点与权限

目标是找出“低权限是否可达”的设备节点。

- 枚举 `/dev`：`adb shell ls -lZ /dev | head`
- 关注：可被应用域访问的节点、权限过宽的节点、异常的 SELinux 标签

### 3.2 syscall 面

syscall 面通常通过：

- seccomp 策略（哪些 syscall 仍然可用）
- 应用/守护进程实际行为（trace）

与 `/notes/android/04-native/03-seccomp` 结合能更快确定“可达 syscall 集合”。

### 3.3 驱动与 ioctl

驱动面常见问题集中在：

- 参数校验不足（结构体大小、指针、嵌套指针）
- 32/64 位兼容层处理错误
- 并发与生命周期竞态

### 3.4 网络栈

网络栈攻击面不仅来自外部网络包，也来自本地 socket 与协议实现。

- 本地 socket：`AF_NETLINK`、`AF_UNIX` 等
- 组件交互：WiFi/蓝牙/基带的驱动与协议栈组合

## 4. 审计 checklist

1. 用户态可达的 `/dev` 节点列表与权限是否合理
2. 关键 ioctl 是否做了调用方权限校验
3. copy_from_user 参数长度是否有上界，是否存在整数溢出
4. 并发路径是否存在引用计数/锁顺序问题

## 参考（AOSP）
- https://source.android.com/docs/core/architecture/kernel — Android 内核/ACK/GKI 的整体视角，便于把“攻击面”映射到实际内核与模块边界。
- https://source.android.com/docs/security/overview/kernel-security — 内核侧安全机制与威胁模型概览（含 ACK/GKI、安全加固方向）。
- https://source.android.com/docs/security/features/gpu-syscall-filtering — 以 GPU 驱动 IOCTL 为例的细粒度过滤与落地注意事项。
