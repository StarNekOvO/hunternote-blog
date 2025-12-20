# 3x00 - system_server 架构

`system_server` 是 Android 框架层的关键进程，承载了绝大多数系统服务。

如果从安全研究视角切入，`system_server` 的重要性来自两点：

- 它是几乎所有“系统能力”的仲裁者（权限、进程、窗口、包管理等）。
- 它暴露了大量 Binder 接口给应用侧调用，是典型的高权限 + 高复杂度攻击面。

## 1. 启动流程
1. **Zygote 孵化**: Zygote 进程启动后，第一个 fork 的就是 `system_server`。
2. **初始化 Native 服务**: 通过 JNI 调用 `nativeInit()`。
3. **启动 Java 服务**: 
   - **引导服务 (Bootstrap Services)**: 如 AMS, PMS, DeviceIdentifiersPolicyService。
   - **核心服务 (Core Services)**: 如 BatteryService, UsageStatsService。
   - **其他服务 (Other Services)**: 如 WMS, InputManagerService。

更贴近源码的主链路（AOSP 路径/类名可能随版本变化，但结构基本稳定）：

- `ZygoteInit.main()` 启动并进入 `runSelectLoop()` 等待请求
- `SystemServer.main()` 作为 `system_server` 的 Java 入口
- `SystemServer.run()`
   - `createSystemContext()`
   - `startBootstrapServices()` / `startCoreServices()` / `startOtherServices()`
- `SystemServiceManager.startService()` 创建并启动各服务
- 各服务注册到 `ServiceManager.addService(name, binder)`

可以把它理解为一个“三阶段初始化 + 注册表”模型：先把最基础、最强依赖的服务启动起来，再逐步启动依赖更少/更外围的服务。

## 2. 安全边界
- **UID 1000**: 运行在 `system` 用户下，拥有极高权限。
- **SELinux**: 受到 `system_server` 域的严格限制。
- **JNI 风险**: 它是 Java 层进入 Native 层的关键入口，JNI 方法的参数校验不严会导致内存破坏。

补充几个实践中经常遇到的“边界点”：

### 2.1 Binder 入口即攻击面

应用侧通过 Binder 调用 `system_server` 的接口，典型入口包括：

- `IActivityManager` / `IActivityTaskManager`
- `IPackageManager`
- `IWindowManager`
- `IAppOpsService`

这些接口的实现大多在 `system_server` 内部，对应的 Service 通常继承或持有一个 Stub（`xxx.Stub`）。安全研究时，优先盯：参数校验、调用方身份校验、跨用户/跨 profile 校验、以及状态机是否有“绕过路径”。

### 2.2 身份切换：`clearCallingIdentity()`

`system_server` 里大量存在：

- 先用调用方身份做权限判断
- 然后用 `Binder.clearCallingIdentity()` 临时切到 `system_server` 身份做实际操作
- 操作完再 `restoreCallingIdentity()`

常见风险点是：权限校验与实际操作对象不一致（TOCTOU）、校验条件过宽、或者校验放在了“错误的分支”里导致绕过。

### 2.3 多用户与 profile 的隔离

很多系统服务都要处理 `userId`/`uid`/`appId` 的组合语义。

- 跨用户数据访问是漏洞高发区（例如把 `UserHandle.getCallingUserId()` 用错、或者把 `userId` 作为可控参数传入后未二次校验）。
- Work profile / clone profile 的策略也可能引入边界条件。

## 3. 常见漏洞/问题类型（偏研究视角）

- **权限校验缺失/顺序错误**：例如校验在修改状态之后才做。
- **导出能力的间接滥用**：借由系统服务代为执行敏感动作（典型：`PendingIntent`、跨进程 `Intent` 转发）。
- **状态机错误**：竞态、重入、异常路径未回滚导致提权或越权。
- **资源耗尽 DoS**：`system_server` 触发 OOM/ANR 会导致重启，影响面大。

## 4. 调试与排查手册

### 4.1 快速确认 `system_server` 状态

- 进程是否存在：`adb shell ps -A | grep system_server`
- 看启动/崩溃循环：`adb logcat -b system -b main -s Zygote ActivityManager SystemServer`

### 4.2 常用 `dumpsys` 入口

- AMS/任务栈：`adb shell dumpsys activity`
- 包管理：`adb shell dumpsys package`
- 窗口：`adb shell dumpsys window`

`dumpsys` 的价值在于：它往往直接暴露 service 内部的关键数据结构（栈、记录表、缓存），能快速定位“状态不对”而不是在日志里猜。

### 4.3 研究源码时的定位建议

- 从 binder interface 的 `Stub.onTransact()`/`xxxService` 的 public 方法入手
- 跟到权限校验调用（`enforceCallingPermission`/`checkPermission`/`AppOps`）
- 再看是否发生了身份切换（`clearCallingIdentity`）以及后续实际写入点

## 5. Canyie (残页) 相关 CVE

> GitHub: https://github.com/canyie | Blog: https://blog.canyie.top

以下是 Canyie 在 Framework/System 层发现的部分漏洞，可对照相关模块的代码学习：

| CVE | 类型 | 简介 | 公告 |
|-----|------|------|------|
| CVE-2024-43080 | EoP/High | System 组件权限校验缺陷，本地提权无需额外权限 | [ASB 2024-11](https://source.android.com/docs/security/bulletin/2024-11-01) |
| CVE-2024-43081 | EoP/High | Framework 层调用者身份校验不当导致提权 | [ASB 2024-11](https://source.android.com/docs/security/bulletin/2024-11-01) |
| CVE-2024-49733 | ID/High | Framework 信息泄露，可能暴露敏感用户/应用数据 | [ASB 2025-01](https://source.android.com/docs/security/bulletin/2025-01-01) |
| CVE-2024-49744 | EoP/High | Framework 权限校验绕过，本地提权 | [ASB 2025-01](https://source.android.com/docs/security/bulletin/2025-01-01) |
| CVE-2025-22432 | EoP/High | System 组件输入验证不当，可执行任意代码 | [ASB 2025-04](https://source.android.com/docs/security/bulletin/2025-04-01) |
| CVE-2025-26464 | EoP/High | AppSearch 服务权限校验缺陷，跨应用数据访问 | [ASB 2025-06](https://source.android.com/docs/security/bulletin/2025-06-01) |
| CVE-2025-32323 | EoP/High | DocumentsUI 文件访问权限绕过 | [ASB 2025-06](https://source.android.com/docs/security/bulletin/2025-06-01) |
| CVE-2025-48535 | EoP/High | Settings 应用权限校验缺陷导致提权 | [ASB 2025-06](https://source.android.com/docs/security/bulletin/2025-06-01) |
| CVE-2025-48554 | DoS/High | Framework 异常处理不当导致 system_server 崩溃 | [ASB 2025-06](https://source.android.com/docs/security/bulletin/2025-06-01) |

## 6. 关联阅读

- `/notes/android/01-sandbox/02-zygote-process`（Zygote 与 fork 模型）
- `/notes/android/02-ipc/01-binder-deep-dive`（Binder 调用链与身份传递）
- `/notes/android/03-services/02-ams`（进程/组件生命周期的核心入口）

## 参考（AOSP）

- 架构概览（system services/system_server 的层级位置）：https://source.android.com/docs/core/architecture
- Zygote（system_server 由 Zygote 孵化的官方说明入口）：https://source.android.com/docs/core/runtime/zygote
- AIDL 概览（平台服务交互入口：service/dumpsys）：https://source.android.com/docs/core/architecture/aidl
- SELinux（enforcing/permissive、domain 概念与调试）：https://source.android.com/docs/security/features/selinux
