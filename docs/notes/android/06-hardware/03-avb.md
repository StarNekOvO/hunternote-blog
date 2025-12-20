# 6x02 - Verified Boot (AVB)

Android Verified Boot (AVB) 是 Android 启动时验证（Verified Boot）的参考实现，目标是在启动链路中尽力保证关键组件的完整性与真实性（具体强制程度取决于设备配置与 bootloader 锁状态）。

AVB 的安全目标可以归纳为三点：

- **完整性**：启动链路上的关键组件不可被静默篡改
- **可验证性**：启动时可证明镜像来自可信签名
- **回滚保护**：阻止把系统降级到已知存在漏洞的旧版本

## 1. 信任链 (Chain of Trust)
1. **Root of Trust**: 固化在硬件中的公钥。
2. **Bootloader**: 验证 `vbmeta` 分区。
3. **Kernel**: 验证 `system`, `vendor` 等分区（通过 dm-verity）。

补充关键概念：

- **vbmeta**：包含分区摘要与签名等元数据，是启动链的核心锚点
- **dm-verity**：以 Merkle tree 的方式对块设备做完整性校验
- **verity 错误处理策略**：触发时是只读挂载失败、还是进入 recovery（实现与配置相关）

## 2. 启动镜像与关键分区（boot / vendor_boot / system）

从 AVB 的视角理解启动链，通常需要把“启动镜像是什么、系统分区如何组织、更新如何切换”这三件事串起来。

### 2.1 `boot.img`：启动入口的镜像容器

`boot.img` 可以视为启动阶段的关键载体，常见组成包括：

- **kernel**：Linux 内核二进制
- **ramdisk**：早期启动使用的临时根文件系统（通常以 cpio 归档形式存在）
- **dtb/dtbo**：设备树相关数据，用于描述硬件拓扑与启动参数

安全研究中，`boot.img` 之所以重要，是因为它处在“最早期的可信边界”附近：它影响 `/init` 的启动上下文、内核启动参数的解释方式，以及后续分区挂载与完整性校验的策略落点。

### 2.2 ramdisk：早期用户态与挂载切换的过渡层

ramdisk 的核心作用是：在真正的 `system`/`vendor` 等分区被挂载前，提供一个可运行的最小用户态环境，启动 `/init` 并完成第一轮系统初始化（服务启动、分区挂载、SELinux 初始化与策略加载等）。

版本演进上，ramdisk 的内容总体趋向“最小化”：更多初始化逻辑被迁移到 system/vendor 侧，并通过更清晰的边界与校验机制约束。

### 2.3 `system.img`：框架与系统组件的主要载体

`system.img` 是框架与系统组件的重要承载分区，典型演进趋势包括：

- 从“可写分区”逐步过渡为“只读 + 完整性校验”（dm-verity）
- 文件系统从 ext4 向更偏只读场景的实现演进（如 EROFS，在部分版本/机型中常见）
- **动态分区**（super 分区）引入后，`system`/`vendor`/`product` 等可共享空间池，更新时按需分配

对安全研究而言，`system` 分区的核心关注点不在“是否能写入”，而在“完整性校验是否严格、错误策略是否可观测、更新/回滚是否存在边界条件”。

### 2.4 GKI 背景下的 `vendor_boot.img`

在 GKI 推进后，启动相关镜像可能进一步拆分：

- `boot.img` 更偏“通用内核 + 极简启动所需内容”
- `vendor_boot.img` 承载更多厂商特定的启动内容（如 vendor ramdisk、dtbo 等）

这会直接影响启动链的校验对象与实现复杂度：校验逻辑更依赖厂商 Bootloader 对多镜像、多分区元数据的正确处理。

## 3. 回滚保护（Rollback Protection）

回滚保护用于防止降级到旧版镜像：

- 通过版本号/rollback index 等机制
- 依赖硬件或安全存储记录不可逆的版本状态

该机制在安全更新策略中非常关键：补丁只有在“无法轻易回退”时才真正生效。

## 4. 解锁 Bootloader
- **风险**: 解锁后，信任链断裂，系统可以加载未经签名的代码。
- **Root 的代价**: 许多依赖硬件安全的应用（如 Google Pay, 银行 App）会通过 **Play Integrity API** 检测到设备状态异常。

## 5. 与设备态检测的关系

很多应用侧的“设备可信度检测”会间接依赖 AVB/bootloader 状态：

- bootloader 解锁状态
- 系统分区完整性
- 设备是否处于可调试/非正式构建

## 6. OTA 更新机制与安全关注点

OTA 与 AVB 是“更新可被信任”的两个侧面：OTA 负责把新版本可靠落盘，AVB 负责在启动时拒绝被静默篡改/回退的镜像。

### 6.1 Recovery OTA 与 A/B OTA 的差异

- **Recovery OTA（早期常见）**：通过恢复环境写入关键分区；流程简单但容错依赖恢复环境与写入原子性。
- **A/B OTA（Android 7+ 常见）**：把系统分区分为 A/B 两套，后台写入非当前槽位，下次重启切换；失败可回滚到旧槽位，提高可用性。

### 6.2 虚拟 A/B 与动态分区带来的复杂度

虚拟 A/B 与动态分区常与 snapshot/合并流程相关，会引入更复杂的状态机与边界条件。安全研究中，关注点通常落在：

- 校验发生的时机与对象是否一致（元数据/分区内容/快照合并前后）
- 回滚/降级路径是否被正确约束（含 rollback index 与版本策略）
- 失败回滚的状态是否可能导致“不一致但可启动”的异常组合

## 7. 排查与验证（偏工程）

不同设备暴露的信息不同，但常见思路包括：

- 通过 bootloader/fastboot 侧信息确认锁状态
- 观察启动过程的 verity 相关日志（取决于可观测性）
- 确认 system/vendor 分区是否启用 verity 与其错误处理策略

## 8. 关联阅读

- `/notes/android/06-hardware/04-keystore`（attestation 通常会把设备状态纳入证明链）

## 参考（AOSP）

- https://source.android.com/docs/security/features/verifiedboot — 启动时验证总览：信任链、回滚保护与版本演进。
- https://source.android.com/docs/security/features/verifiedboot/avb — AVB 参考实现入口：vbmeta、校验对象与实现视角。
