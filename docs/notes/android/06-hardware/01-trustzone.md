# 6x00 - TrustZone and TEE

TrustZone 是 ARM 架构提供的硬件隔离技术，将处理器划分为 **Normal World** (REE) 和 **Secure World** (TEE)。

TrustZone 的核心价值是：把高价值资产（密钥、指纹模板、DRM 机密）放在一个更难被 REE 攻击链直接触达的执行环境中。

## 1. TEE (Trusted Execution Environment)
- **核心作用**: 运行可信应用 (Trustlets)，处理指纹、支付、DRM 等敏感逻辑。
- **隔离机制**: 硬件级别的内存和外设隔离。

补充几个常见组成：

- **Secure Monitor**：世界切换的控制者（EL3/Monitor）
- **Trusted OS**：TEE 的操作系统（厂商实现差异很大）
- **Trusted Application/Trustlet**：运行在 TEE 内的应用逻辑

## 2. 通信与边界

### 2.1 SMC 与调用面

REE 与 TEE 通信的核心机制通常围绕：

- **SMC (Secure Monitor Call)**：触发世界切换的入口
- **共享内存/消息缓冲区**：传递参数与数据

研究时常见风险点：

- 参数结构体校验不足（长度、指针、嵌套对象）
- 共享内存边界错误（REE 可控数据被当成可信）
- 句柄/对象生命周期管理错误（UAF/竞态）

## 3. 安全研究

### 3.1 威胁模型与常见目标

- **密钥机密性**：硬件密钥是否可能通过接口逻辑缺陷被导出
- **强身份认证**：指纹/人脸等认证链路是否存在旁路
- **TEE 完整性**：TEE 内核/Trusted OS 的漏洞是否可被 REE 触发

### 3.2 厂商差异

TEE 实现高度依赖 SoC 与厂商栈：

- 不同厂商的 Trusted OS、驱动、TA 接口完全不同
- 同一 Android 版本在不同设备上的 TEE 攻击面差异很大

## 4. 排查与验证（偏工程）

可观测信息通常有限，但思路包括：

- 确认关键能力是否硬件支持（如 StrongBox、KeyMint 是否在 TEE/安全芯片）
- 观察 keystore/attestation 的行为差异（失败原因、错误码、日志）

## 5. 关联阅读

- `/notes/android/06-hardware/04-keystore`
- `/notes/android/05-kernel/05-avf`

## 参考（AOSP）
- https://source.android.com/docs/security/features/trusty — Trusty TEE：AOSP 的开源可信执行环境实现方案。
- https://source.android.com/docs/security/features — 安全功能总览入口（含 Trusty TEE、Keystore、Verified Boot 等）。
- https://source.android.com/docs/security/features/keystore — Keystore/Keymaster/KeyMint 与 TEE（TrustZone）在密钥保护中的位置。
- https://source.android.com/docs/core/virtualization — AVF 作为“比应用沙盒更强隔离”的另一条路线（与传统 TEE 并存）。
