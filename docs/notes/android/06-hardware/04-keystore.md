# 6x03 - Hardware-backed Keystore

Android Keystore 允许应用在硬件中生成和存储密钥。

Keystore 的核心安全承诺是：

- 密钥材料不以明文形式暴露给普通用户态进程
- 加解密等关键操作在受保护环境内完成（TEE 或安全芯片）
- 可对外提供“可验证的证明”（attestation）

## 1. Keymaster / KeyMint
- **实现**: 运行在 TEE 或 StrongBox (安全芯片) 中。
- **特性**: 密钥永远不会以明文形式出现在用户空间或内核空间。

补充：

- **Keymaster/KeyMint**：接口与实现演进的名称，关键在于“密钥操作在受保护环境执行”
- **StrongBox**：更强隔离的安全芯片实现（并非所有设备具备）
- **Keystore2**：新系统中 keystore 守护进程与接口层的演进（实现细节随版本变化）

## 2. 认证 (Attestation)
- **作用**: 证明密钥确实是在受保护的硬件中生成的，且设备处于安全状态。
- **安全研究**: 寻找 Keymaster 接口中的逻辑漏洞以导出密钥。

### 2.1 Attestation 在证明什么

通常包括两类信息：

- **密钥属性**：算法、用途、是否需要用户认证、有效期等
- **设备/系统状态**：是否为硬件支持、是否处于可信启动状态（与 AVB/boot 状态相关）

### 2.2 信任链

attestation 往往依赖一条证书链来证明其来源可信。链路细节与设备实现相关，但核心思路一致：把证明根绑定到硬件信任根。

## 3. 常见使用模式与安全语义

### 3.1 不可导出密钥

应用侧通常只拿到一个“句柄/别名”，而不是密钥本身：

- 加解密调用通过 keystore 服务转发
- 密钥材料留在 TEE/安全芯片

### 3.2 用户认证绑定

部分密钥可绑定到：

- 锁屏凭据
- 生物识别
- 限时窗口

研究时应关注：认证绑定是否被正确执行、失败路径是否存在旁路。

## 4. 排查与验证（偏工程）

### 4.1 目标信息收集

- 设备是否支持 StrongBox
- KeyMint/Keystore 服务是否正常工作（错误码与日志）
- attestation 请求失败时的原因（网络、证书链、设备状态）

### 4.2 与系统其它机制的耦合

- 与 AVB/boot 状态的耦合（设备态变化会影响 attestation）
- 与 TEE 的耦合（TEE 稳定性与接口实现差异）

## 5. 审计 checklist

1. 密钥是否真正硬件支持（避免“软件实现被误当成硬件”）
2. 使用场景是否需要用户认证绑定（防止密钥被后台静默使用）
3. 错误处理是否泄漏敏感状态信息
4. attestation 结果是否被业务正确校验（证书链与关键字段）

## 6. 关联阅读

- `/notes/android/06-hardware/03-avb`
- `/notes/android/06-hardware/01-trustzone`

## 参考（AOSP）
- https://source.android.com/docs/security/features/keystore — Keystore/Keymaster/KeyMint 的架构与能力演进入口。
- https://source.android.com/docs/security/features/keystore/attestation — 密钥认证（Key Attestation）与 ID 认证的字段语义与验证要点。
