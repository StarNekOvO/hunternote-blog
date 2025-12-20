# 7x02 - Connectivity Security (WiFi/NFC/Baseband)

连接能力的共同特点是：输入来源更不可信（无线/外部设备/运营商网络），且链路跨越多个权限域（应用、系统服务、HAL、驱动、固件）。

## 1. WiFi 安全
- **WPA3 协议**: 现代加密标准。
- **WiFi Direct**: 邻近设备发现中的安全风险。

补充常见研究点：

- 扫描结果解析与状态机（热点切换、断线重连）
- 配置存储与权限边界（哪些应用能触发连接/读取网络信息）
- 与驱动/固件交互的接口面（厂商差异显著）

常见漏洞模式：

- 管理帧/信息元素解析 OOB
- 状态机竞态导致权限/配置错乱
- debug 接口遗留导致信息泄露

## 2. NFC 安全
- **卡模拟 (HCE)**: 支付安全。
- **NDEF 解析**: 格式化字符串或溢出漏洞。

补充：

- NDEF 解析属于典型的“外部输入解析面”，应关注长度、编码与异常路径
- HCE 与支付链路往往与 TEE/Keystore/attestation 相关，边界更复杂

## 3. 基带 (Baseband) 与 RIL
- **RIL (Radio Interface Layer)**: 连接基带与系统的桥梁。
- **基带漏洞**: 攻击者通过伪基站实现远程代码执行。

补充：

- 基带与应用处理器是两个不同的安全域
- RIL/telephony 框架位于系统侧，既要处理来自基带的不可信输入，也要向应用提供 API

常见风险点：

- 基带侧解析漏洞（固件/协议实现）
- RIL 消息解析与状态机
- 权限边界错误导致的通话/短信/网络能力滥用

## 4. 观测与排查（偏工程）

- WiFi：`adb logcat | grep -iE 'wifi|wpa|wificond|hostapd'`
- NFC：`adb logcat | grep -iE 'nfc|ndef'`
- Telephony/RIL：`adb logcat | grep -iE 'ril|radio|telephony'`

不同设备与版本的日志 tag/组件名称会变化，但“先定位进程与服务、再定位协议解析点”的思路不变。

## 5. 关联阅读

- `/notes/android/06-hardware/01-trustzone`（支付/认证链路经常与 TEE 关联）
- `/notes/android/06-hardware/04-keystore`

## 参考（AOSP）
- https://source.android.com/docs/core/connect — Android 连接子系统总览入口（覆盖 Wi‑Fi/NFC/电话等能力域）。
- https://source.android.com/docs/core/ota/modular-system/wifi — Wi‑Fi 可更新模块的边界与组件说明（与设备/OEM 定制的交界处）。
- https://source.android.com/docs/core/ota/modular-system/nfc-services — NFC 服务 Mainline 模块入口（组件边界与依赖项）。
