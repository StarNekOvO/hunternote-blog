# 1x01 - Zygote 与进程创建

在 Android 中，几乎所有的应用进程都是由 **Zygote** 进程“孵化”（fork）出来的。Zygote 的存在是为了加快应用启动速度并优化内存占用。

## 1. Zygote 的启动与预加载

Zygote 是由 `init` 进程根据 `init.rc` 脚本启动的。它的核心任务是：
1. **启动 ART 虚拟机**: 初始化 Android 运行时环境。
2. **预加载核心类与资源**: 加载数千个常用的 Java 类（如 `android.widget.*`）和系统资源。
3. **监听 Socket**: 打开 `/dev/socket/zygote`，等待来自 `system_server` 的进程创建请求。

由于 Linux 的 **Copy-on-Write (COW)** 机制，所有从 Zygote fork 出来的子进程都会共享这些预加载的内存页，直到它们尝试修改这些内存。这极大地节省了系统内存。

## 2. 进程孵化流程：从 Socket 到 Fork

当用户点击图标启动应用时，`ActivityManagerService` (AMS) 会通过 Socket 向 Zygote 发送一个请求。

### 2.1 `ZygoteConnection` 处理请求
在 Zygote 进程中，`ZygoteServer` 接收到连接后，会交给 `ZygoteConnection` 处理。

- **参数解析**: 解析 AMS 传来的 UID、GID、Runtime Args、Capabilities 等参数。
- **权限校验**: Zygote 会检查请求方的身份，确保只有 `system_server` 等授权进程能请求创建新进程。

### 2.2 `fork` 与 `specialize`
调用 `Zygote.forkAndSpecialize()` 进入 Native 层：
1. **`fork()`**: 创建子进程。此时子进程拥有与 Zygote 相同的权限（root）。
2. **`specializeAppProcess()`**: 这是安全的关键。子进程在执行任何应用代码之前，必须“降权”：
    - **设置凭证**: 调用 `setresuid()` 和 `setresgid()` 切换到应用的 AID。
    - **丢弃 Capabilities**: 移除不必要的 Linux 特权。
    - **设置 SELinux 标签**: 切换到 `untrusted_app` 等受限上下文。
    - **应用 Seccomp 策略**: 限制系统调用。

## 3. Linux Capabilities 的丢弃

Linux Capabilities 将 root 权限细分为多个子项（如 `CAP_NET_RAW`, `CAP_SYS_ADMIN`）。

- **Zygote 的权限**: Zygote 运行在 root 权限下，拥有完整的 Capabilities。
- **降权过程**: 在 `specialize` 阶段，子进程会调用 `capset()`。对于普通应用，所有的 Capabilities 都会被清空。
- **安全意义**: 即使应用进程内发生了代码执行漏洞，攻击者也无法执行需要特权的操作（如挂载文件系统或修改网络配置），因为内核已经剥夺了这些能力。

## 4. 隔离增强：App Zygote 与 WebView Zygote

为了进一步收紧沙箱，现代 Android 引入了专门的 Zygote 变体：
- **WebView Zygote**: 专门用于孵化 WebView 渲染进程，拥有更严格的 SELinux 策略和更少的权限。
- **App Zygote**: 允许应用定义自己的 Zygote 进程，用于孵化该应用的隔离服务（Isolated Services），减少主进程被攻破后的影响。

## 5. CVE 案例分析：CVE-2020-0096 (StrandHogg 2.0)

虽然 StrandHogg 2.0 主要利用的是 Activity 栈管理逻辑，但其核心在于攻击者可以利用 `allowTaskReparenting` 和 `taskAffinity` 属性，在应用启动时（即进程被 Zygote 孵化并进入 Activity 调度阶段）劫持任务栈。

- **影响**: 攻击者可以诱导用户在看似合法的应用界面中输入凭据，而实际该界面属于恶意进程。
- **防御**: Google 通过加强 `ActivityStack` 的状态校验和限制跨 UID 的任务重组修复了此问题。

## 参考（AOSP）

- 应用沙盒（UID 隔离、SELinux 沙盒与 seccomp 相关演进）：https://source.android.com/docs/security/app-sandbox
- SELinux（enforcing/permissive、domain 概念）：https://source.android.com/docs/security/features/selinux
- 架构概览（system_server/系统服务/运行时层级位置）：https://source.android.com/docs/core/architecture
- Zygote（进程孵化、WebView Zygote/USAP 等现代行为）：https://source.android.com/docs/core/runtime/zygote
