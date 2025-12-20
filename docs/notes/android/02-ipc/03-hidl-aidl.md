# 2x02 - HIDL 与 AIDL (Treble 架构)

随着 Project Treble 的引入，Android 的 IPC 体系变得更加复杂，但也更加模块化。

这一章的研究目标不是记名词，而是回答三个问题：

1. Framework 与 Vendor 的边界在哪里？
2. HAL 进程/接口是如何被发现与约束的？
3. 为什么“把东西搬出 system_server”会显著改变攻击面？

## 1. Project Treble 的初衷

在 Treble 之前，框架层（Framework）与硬件抽象层（HAL）紧密耦合。升级系统往往需要芯片厂商（如高通）配合更新 HAL。
Treble 通过将 Framework 与 HAL 分离，实现了“一次编写，到处运行”的系统升级。

更具体地说：

- **接口稳定性**：Framework 通过稳定接口调用 Vendor 侧实现
- **可替换性**：Vendor 不需要跟着 Framework 每次大改
- **安全隔离**：让高风险解析/硬件交互跑在更合适的域里

## 2. HIDL (HAL Interface Definition Language)

HIDL 是专门为 HAL 设计的接口语言。

- **Binderized 模式**: HAL 运行在独立的进程中，通过 `/dev/hwbinder` 与 Framework 通信。这是最安全、最推荐的模式。
- **Passthrough 模式**: 为了兼容旧版 HAL，允许 Framework 直接加载共享库（.so）。

### 安全意义
通过将 HAL 移出 `system_server` 进程，即使某个驱动程序（如相机、传感器）存在漏洞，攻击者也只能控制该 HAL 进程，而无法直接获取系统核心权限。

补充：Passthrough 模式的安全语义更差，因为它把 vendor 的 .so 直接拉进了 framework 进程空间，等价于扩大了高权限进程的攻击面（这也是 Treble 推 binderized 的原因之一）。

## 3. `binder` 与 `hwbinder` 的差异（理解边界）

- `binder`：应用/系统服务广泛使用的通用 binder
- `hwbinder`：为 HAL 体系设计的 binder（历史上设备节点与服务发现体系不同）

从安全视角，关心的不是“哪个更高级”，而是：

- 哪些进程能访问对应的 binder 设备
- 服务运行在哪个 SELinux 域
- 接口是否稳定、是否容易被 fuzz

## 4. AIDL 的统一

在 Android 11 之后，AIDL 开始取代 HIDL 成为 HAL 的首选接口语言（称为 Stable AIDL）。

- **优势**: 统一了应用层和系统层的开发体验。
- **VNDK**: 供应商原生开发套件，确保了库的版本兼容性。

Stable AIDL 的关键词：

- **接口版本化**：明确兼容策略（新增方法、废弃方法）
- **跨分区稳定**：system/vendor 边界上更可控

## 5. VINTF 与服务发现（研究入口）

在 Treble 体系下，“系统有哪些 HAL 服务、版本是多少、由谁提供”通常由清单机制描述（设备厂商与系统镜像共同决定）。

研究时常需要回答：

- 目标设备上是否存在某 HAL 服务
- 服务是 binderized 还是 passthrough
- 接口版本与实现位置

这些信息往往可以通过系统工具/清单侧线索定位（具体命令与文件在不同版本/厂商上差异较大）。

## 6. 攻击面分析

- **hwbinder 模糊测试**: 针对 HAL 接口进行 Fuzzing 是发现底层提权漏洞的高效手段。
- **共享内存越界**: HAL 经常使用共享内存传递大量数据（如视频流），如果边界检查不严，会导致内存破坏。

补充常见漏洞模式：

- **接口参数契约不一致**：长度字段单位/范围解释不一致
- **句柄/FD 传递**：错误地把高权限资源句柄泄漏到低权限进程
- **状态机与并发**：硬件事件回调 + IPC 调用混合时容易出竞态

## 7. 研究路径建议

### 7.1 从接口定义入手

- 找到接口定义文件（HIDL/AIDL），列出方法、参数类型、版本
- 找到 service 实现进程与域（system/vendor，SELinux domain）

### 7.2 从“可被外部输入影响”的链路入手

比如：

- 相机/多媒体：输入数据复杂、共享内存多
- 传感器/定位：数据流持续、事件驱动明显

### 7.3 fuzzing 的定位方式

对 HAL 接口做 fuzz 的关键是：

- 选择可达接口（进程是否能调用它）
- 搞清楚参数边界与对象生命周期（尤其是 buffer/handle/FD）

## 参考（AOSP）

- 架构概览（含 HAL 层级、Treble 总体介绍入口）：https://source.android.com/docs/core/architecture
- HIDL（Android 10 起废弃，官方迁移口径）：https://source.android.com/docs/core/architecture/hidl
- AIDL 概览：https://source.android.com/docs/core/architecture/aidl
- 稳定的 AIDL（Stable AIDL）：https://source.android.com/docs/core/architecture/aidl/stable-aidl
