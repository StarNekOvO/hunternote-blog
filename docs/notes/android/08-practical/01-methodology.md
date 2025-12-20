# 8x00 - Vulnerability Research Methodology

安全研究不是碰运气，而是一套系统的方法论。

本章目标是把 Android 研究工作拆成可重复执行的流程：从选目标、定位入口、拿到可观测证据，到完成定级与修复验证。

## 1. 攻击面分析 (Attack Surface Mapping)
- **外部接口**: 开放端口、Socket、Intent Filter。
- **特权进程**: 以 root 或 system 运行的服务。
- **复杂解析器**: 处理多媒体、压缩包、协议包的代码。

补充：Android 的攻击面往往跨层：

- App → Framework → system_server（Binder）
- Framework → HAL（AIDL/HIDL）→ 驱动（ioctl）
- 无线输入（WiFi/蓝牙/NFC/基带）→ 协议栈 → 系统服务

因此映射攻击面时建议同时做两张表：

1. **入口清单**：可被低权限/外部输入触发的入口
2. **资产清单**：高价值资源与权限边界（密钥、认证、账户、系统设置、隐私数据）

## 2. 漏洞挖掘手段
- **代码审计 (Static Analysis)**: 寻找危险函数、逻辑缺陷。
- **模糊测试 (Fuzzing)**: 使用 AFL++, LibFuzzer, Syzkaller。
- **动态分析**: 监控 API 调用、内存访问。

## 3. 一条可落地的研究流水线

### 3.1 选目标

常见优先级：

- 高权限且输入可控（system/root 进程 + 外部输入面）
- 复杂解析器（媒体、协议、序列化）
- 厂商定制组件（差异大、审计与 fuzz 价值高）

### 3.2 建立可观测性

- 日志：`adb logcat`
- 系统状态：`dumpsys`、`service list`
- native 崩溃证据：tombstone/堆栈（环境允许时）

目标是让每一次触发都能留下“可对比的证据”，避免只靠现象猜测。

### 3.3 复现最小化

- 把输入缩减到最小：最小 Intent、最小数据包、最小媒体样本
- 把环境固定：版本号、patch level、配置开关

### 3.4 定级与影响面

常见定级维度：

- 触发条件：是否需要交互、是否需要本地权限
- 影响类型：信息泄露/越权/DoS/RCE/LPE
- 缓解机制：SELinux/seccomp/进程拆分是否把影响限制在低权限域

### 3.5 修复验证

- 对照补丁前后：是否仍可触发、触发后表现是否改变
- 验证回归风险：是否影响正常功能路径

## 4. 常用工具清单（按层）

- Framework：`adb shell dumpsys <service>`、`service call`（部分场景）、源码交叉引用
- Native：gdb/lldb、符号化、tombstone
- Kernel：dmesg、trace/perf（取决于环境）
- Fuzz：libFuzzer/AFL++/syzkaller（目标选择与 harness 设计是关键）

## 5. 输出物（研究交付）

一份高质量输出通常包含：

- 最小复现步骤与输入
- 影响面说明（版本/设备范围）
- 根因分析（关键代码路径与校验缺失点）
- 修复建议与验证结果

## 参考（AOSP）
- https://source.android.com/docs/setup/contribute/report-bugs — AOSP 官方的报告/跟踪 bug 流程与写高质量复现信息的要求。
- https://source.android.com/docs/security/bulletin — 安全公告入口：用于对齐“补丁时间线/受影响版本范围/修复验证”的权威来源。
