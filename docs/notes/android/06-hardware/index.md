# Part 6: Hardware Security

## 1. 专题章节

### [6x00 - TrustZone and TEE](./01-trustzone.md)
- **核心内容**: 硬件隔离原理、SMC 调用、TEE 漏洞分析。

### [6x01 - ARM CCA](./02-arm-cca.md)
- **核心内容**: 机密计算架构、Realm 隔离机制。

### [6x02 - Verified Boot (AVB)](./03-avb.md)
- **核心内容**: 启动链完整性校验、解锁 Bootloader 的风险。

### [6x03 - Hardware-backed Keystore](./04-keystore.md)
- **核心内容**: Keymaster/KeyMint 实现、硬件级密钥保护。

## 参考（AOSP）
- https://source.android.com/docs/security/features — Android 安全功能总览入口（含 TEE/Keystore/Verified Boot）。
- https://source.android.com/docs/security/features/verifiedboot — Verified Boot/AVB 的官方入口。
