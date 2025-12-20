# 2x00 - Binder 深度解析

Binder 是 Android 的核心 IPC 机制。系统内绝大多数跨进程操作（从拨打电话到获取地理位置）最终都会转化为 Binder 调用。

Binder 的价值不只是“能 IPC”，而是它把三件事绑定在了一起：

- **高性能的数据传递**（共享缓冲区 + 拷贝控制）
- **可追溯的身份**（驱动附带 caller UID/PID，不可伪造）
- **统一的服务发现**（ServiceManager）

## 1. Binder 架构概览

Binder 采用典型的 Client-Server 架构，但其实现涉及内核驱动、用户空间库和框架层：

- **Binder 驱动 (`/dev/binder`)**: 运行在内核态，负责进程间的数据传递、缓冲区管理和身份校验。
- **ServiceManager**: 系统的“电话簿”，负责管理所有系统服务的注册与查询。
- **Client/Server**: 业务逻辑的实现者。

### 核心交互流程
1. **注册**: Server 向 ServiceManager 注册自己。
2. **查询**: Client 向 ServiceManager 请求特定服务的代理（Proxy）。
3. **调用**: Client 调用 Proxy 的方法，驱动将请求转发给 Server，Server 处理后返回结果。

可以把这套系统分成三层来理解：

- **框架层（Java/Kotlin）**：AIDL Stub/Proxy、`Parcel` 序列化
- **用户态 native 库**：libbinder（线程池、对象引用、death recipient）
- **内核驱动**：`/dev/binder` 负责调度、缓冲区、身份注入

## 2. Binder 里的关键对象（概念模型）

理解几个概念能极大提升源码阅读效率：

- **Service**：一个名字对应一个 Binder 对象（通过 ServiceManager 发布）
- **Handle**：client 侧拿到的“引用编号”（指向某个远端 binder 对象）
- **Node/Ref**：驱动内部对 binder 对象与引用关系的抽象
- **Transaction**：一次调用请求（携带 code、flags、data、offsets、caller 信息）

核心事实：**caller 的 uid/pid 由驱动填入**，服务端读取到的 `getCallingUid()` 不依赖 client 传参。

## 3. 安全校验机制

Binder 的安全性建立在驱动程序对发送方身份的**不可伪造性**保证上：

- **`getCallingUid()`**: 获取调用方的用户 ID。这是最常用的安全检查手段。
- **`getCallingPid()`**: 获取调用方的进程 ID。注意：PID 在进程重启后可能被复用，不如 UID 可靠。

### 常见的安全陷阱
- **信任代理**: 如果一个高权限服务 A 代理了低权限应用 B 的请求去访问服务 C，服务 C 看到的调用方可能是 A。如果 A 没有正确校验 B 的权限，就会导致**混淆代理（Confused Deputy）**攻击。
- **接口暴露**: 开发者忘记在 `onTransact` 中检查权限，导致任何应用都能调用敏感接口。

补充几个更“实现层”的坑点：

- **`oneway` 事务**：异步调用不等待返回，服务端若处理不当可能引入竞态/重入问题。
- **`Parcel` 反序列化**：数组长度/字符串长度/嵌套对象层数如果不做限制，容易 DoS。
- **接口 token 校验**：AIDL 通常会写入 interface descriptor；服务端要 `enforceInterface()`（或等价校验）防止错误路由。
- **权限校验位置错误**：先执行敏感操作再校验、或在错误分支里校验导致绕过。

## 4. 一次调用的典型路径（概念级）

以 Java AIDL 为例，常见链路是：

1. Client 调用 `Proxy.xxx()`
2. `Parcel` 写入参数（以及 interface token）
3. `transact(code, data, reply, flags)` 进入驱动
4. Server 侧线程池取出事务 → `Stub.onTransact(code, data, reply, flags)`
5. Stub 反序列化参数 → 调用真实实现 → 写回 reply

研究时很实用的定位策略：

- 从目标系统服务的 AIDL 接口方法入手 → 找到对应 `code`
- 在 service 端 `onTransact`/实现方法中定位权限校验
- 追踪到最终的“写入点/敏感动作”

## 5. CVE 案例：CVE-2019-2215 (Bad Binder)

这是一个经典的 Binder 驱动漏洞，属于 Use-After-Free (UAF)。

- **成因**: 在 `BINDER_THREAD_EXIT` 过程中，对 `wait` 队列的处理存在逻辑错误，导致可以释放正在使用的内存。
- **影响**: 攻击者可以实现本地提权（LPE），获取 Root 权限并绕过沙箱。
- **启示**: 即使是经过多年打磨的核心组件，其复杂的并发处理逻辑仍可能隐藏致命漏洞。

## 6. 调试与观测

### 6.1 枚举与定位服务

- `service list`：列出所有注册服务（名字是做研究的入口索引）
- `dumpsys <service>`：查看服务内部状态（很多情况下能直接看到关键数据结构）

### 6.2 观测 Binder 流量/热点

不同 Android 版本可用接口不同，常见思路包括：

- `dumpsys binder_calls_stats`：查看 binder 调用统计（谁在调用谁、频率、耗时）
- debugfs/binder 状态（需要 root/调试内核）：查看 binder 线程、ref、transaction 等

### 6.3 研究时的最小验证方法

- 用 `adb shell service call <service> <code> ...` 构造最小调用（适用于部分服务）
- 对照 AIDL 方法与 code，确认调用确实打到了目标路径

## 7. 安全审计 checklist（Binder 接口通用）

1. 入口是否校验 caller（UID/permission/AppOps/signature）
2. 是否存在 confused deputy（代表别人访问另一个服务）
3. `Parcel` 反序列化是否有长度/深度限制（防 DoS）
4. 是否存在 `clearCallingIdentity()` 后使用 caller 可控参数做敏感写入
5. 异步/回调是否可能重入导致状态机错误

## 参考（AOSP）

- AIDL 概览（说明 AIDL 基于 Binder 驱动、含 adb/service/dumpsys 交互入口）：https://source.android.com/docs/core/architecture/aidl
- HIDL（说明 Android 10 起 HIDL 废弃、替换为 AIDL）：https://source.android.com/docs/core/architecture/hidl
- HIDL Binder IPC（HIDL 侧对 Binder IPC 的专门说明）：https://source.android.com/docs/core/architecture/hidl/binder-ipc
