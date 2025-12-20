# 5x03 - Kernel Mitigations

为了对抗内核漏洞，Android 引入了多项硬件和软件缓解技术。

理解缓解的关键不是背缩写，而是把它们映射到“攻击链的哪个环节被打断”：

- 信息泄露是否更难
- 控制流劫持是否更难
- 内存破坏是否更容易被检测/终止

## 1. 软件缓解
- **KASLR (Kernel Address Space Layout Randomization)**: 内核地址空间布局随机化。
- **CFI (Control Flow Integrity)**: 控制流完整性；在内核语境下常见实现是 clang kCFI，用于限制间接调用目标集合。
- **SCS (Shadow Call Stack)**: 影子栈，保护函数返回地址。

### 1.1 KASLR

- 目标：提高地址预测成本
- 现实边界：若存在稳定信息泄露，KASLR 价值会下降

### 1.2 CFI

- 目标：限制间接跳转目标集合，降低控制流劫持成功率
- 现实边界：对“数据流攻击”帮助有限；兼容性与性能约束会影响覆盖面

### 1.3 SCS

- 目标：保护返回地址链，降低传统 ROP 的可行性
- 现实边界：仍需与其他机制组合，单独并非万能

## 2. 硬件增强
- **PAN (Privileged Access Never)**: 禁止内核直接访问用户态数据。
- **PXN (Privileged Execute Never)**: 禁止内核执行用户态代码。
- **PAC (Pointer Authentication Codes)**: 指针身份验证。
- **MTE (Memory Tagging Extension)**: 内存标记扩展，硬件级检测内存破坏。

### 2.1 PAN/PXN

目标是减少“内核把用户态当可信内存”的机会，降低某些类型内存破坏链路的可用性。

### 2.2 PAC

通过对指针增加认证，降低指针被篡改后仍可用的概率。

### 2.3 MTE

以较低成本检测部分 UAF/越界，常见结果是：

- 漏洞更早暴露（开发期/测试期更容易崩）
- 利用稳定性下降

现实边界：MTE 的启用策略可能按进程/按构建类型不同，需以实际设备配置为准。

## 3. 组合效果与策略

内核缓解通常与：

- SELinux
- seccomp
- 进程拆分与权限拆分

共同形成“分层防护”。在复现问题时，必须明确是哪一层把链路打断。

## 4. 观测与确认（偏排查）

不同设备暴露的可观测接口不同，但常见可行思路包括：

- 查看内核配置与启动参数（部分需要 root/工程环境）
- 通过崩溃形态判断是否触发硬化检查（例如内存标记/完整性检查）

## 5. 关联阅读

- `/notes/android/04-native/03-seccomp`
- `/notes/android/05-kernel/02-selinux`

## 参考（AOSP）
- https://source.android.com/docs/security/overview/kernel-security — Android 内核安全总览：内核侧安全机制与加固方向的入口。
- https://source.android.com/docs/security/features — 安全功能总览入口（SELinux、Verified Boot、Keystore 等），用于把缓解机制放在平台安全模型里理解。
