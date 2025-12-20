# 2x03 - 其他 IPC 机制

虽然 Binder 占据了 Android IPC 的 90%，但在底层和特定场景下，其他 Linux 传统的 IPC 机制依然活跃。

这类 IPC 的共同特点是：

- 语义更“原始”（更像 Linux 通用机制）
- 安全属性依赖**文件权限/进程凭据/SELinux 策略**
- 容易出现“配置错误”型问题（权限过宽、路径可控、缺少鉴权）

## 1. Unix Domain Sockets (UDS)

UDS 常用于 Native 守护进程（Daemons）之间的通信，例如 `adbd`、`installd`、`vold`。

- **安全风险**: 权限配置不当。如果一个 Socket 文件被设置为 `666`，任何应用都能连接并发送指令。
- **SELinux 保护**: 现代 Android 依赖 SELinux 严格限制谁可以 `connectto` 或 `write` 特定的 Socket。

补充几个审计要点：

- **鉴权方式**：UDS 常用 `SO_PEERCRED` 获取对端 UID/PID/GID（如果服务端不做这一步，容易被任意进程伪装）
- **Socket 路径可控**：如果路径在可写目录下，可能被替换/抢占
- **协议解析**：自定义二进制协议同样会有边界检查/整数溢出/反序列化风险

快速排查思路：

- `adb shell ss -xl` / `netstat -xl`（不同系统工具可用性不同）
- `adb shell ls -lZ <socket_path>` 看权限与 SELinux context

## 2. 共享内存 (Shared Memory)

Android 引入了 `ashmem` (Anonymous Shared Memory)，后来逐渐转向 Linux 主线的 `memfd`。

- **特点**: 允许不同进程共享同一块物理内存，效率极高。
- **安全陷阱**: 
    - **竞争条件 (Race Condition)**: 两个进程同时读写同一块内存。
    - **文件描述符传递**: 通过 Binder 传递 ashmem 的文件描述符（FD）。如果接收方可以重新映射（mmap）该 FD 并修改内容，可能导致发送方逻辑崩溃。

补充：共享内存的核心风险是“双方对这块 buffer 的解释是否一致”。

- 结构体/头部字段是否可信
- 长度字段是否会被另一侧当成边界
- 是否存在 TOCTOU（检查与使用之间内容被改）

安全建议：

- 共享内存里尽量只放 payload，不放可控的“控制字段”
- 对所有长度/offset 做上下界限制
- 对 mmap 权限做最小化（能只读就别可写）

## 3. Pipes & FIFO

主要用于简单的单向数据流传递。

常见风险更多来自“谁能写/谁能读”：

- FIFO 路径在可写目录下可能被替换
- 服务端把 pipe 当成可信输入导致命令/协议注入

## 4. System Properties（属性服务，常被忽略）

Android 的属性系统也是一种“跨进程状态传递”机制。

研究视角常见关注点：

- 哪些属性可由普通应用影响
- 属性变更是否会触发高权限进程的行为变化
- 厂商定制属性是否引入额外后门/调试开关

这部分通常与 `init`/property service/SELinux 策略强相关。

## 4. 总结：IPC 安全检查清单

在审计 Android IPC 接口时，应关注以下几点：
1. **身份校验**: 是否使用了 `getCallingUid()` 并与预期匹配？
2. **权限检查**: 是否调用了 `checkCallingPermission()`？
3. **数据校验**: 传入的 Parcel 数据是否进行了严格的边界检查？
4. **序列化安全**: 是否存在反序列化漏洞（如 `Parcel.readSerializable()`）？

补充两条更通用但很实用的检查：

5. **资源限制**：是否限制消息大小、频率、连接数（防 DoS）
6. **可信边界**：是否把“本地 socket/共享内存”误当成天然可信输入

## 参考（AOSP）

- SELinux（socket/file/type 的策略约束背景，适合对照 connectto/allow 的语义）：https://source.android.com/docs/security/features/selinux
- 架构概览（原生守护进程与系统服务定位）：https://source.android.com/docs/core/architecture
