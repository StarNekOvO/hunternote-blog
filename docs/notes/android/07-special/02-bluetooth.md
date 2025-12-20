# 7x01 - Bluetooth Security

Android 的蓝牙协议栈（Fluoride/Gabeldorsche）运行在 `com.android.bluetooth` 进程中。

蓝牙的安全研究价值在于：它是典型的“无线近场输入面”，输入复杂、协议层级多、且与硬件/厂商实现高度耦合。

## 1. 攻击面
- **协议解析**: 处理复杂的蓝牙协议包（L2CAP, GATT, SMP）。
- **配对过程**: 身份验证绕过。

补充常见入口：

- 发现/广播（advertising/scanning）
- 连接建立与配对（pairing/bonding）
- GATT 服务与特征读写（BLE）
- 经典蓝牙 profile（A2DP/HFP/AVRCP 等）

## 2. 历史漏洞
- **BlueFrag (CVE-2020-0022)**: 蓝牙协议栈中的远程代码执行漏洞。
- **BrakTooth**: 影响多个蓝牙芯片组的系列漏洞。

## 3. 典型漏洞模式

- **协议解析边界检查**：长度字段、分片重组、状态机转换
- **鉴权/授权逻辑错误**：配对状态与访问控制不一致
- **并发与竞态**：连接断开/重连、多个 profile 同时工作
- **跨层契约问题**：framework ↔ native stack ↔ firmware 的参数解释不一致

## 4. 研究切入点

### 4.1 Android 系统侧

- framework API 与权限边界（哪些操作需要哪些权限/用户确认）
- `com.android.bluetooth` 进程与其 binder/接口面

### 4.2 芯片与固件侧

- 控制器固件漏洞（BrakTooth 等）
- HCI 层交互与异常包处理

## 5. 调试与排查

可用工具与版本相关，但常见思路包括：

- 观察蓝牙进程状态：`adb shell ps -A | grep -i bluetooth`
- 观察日志：`adb logcat | grep -iE 'bluetooth|btif|btstack|gatt|l2cap'`
- 观察系统服务状态：`adb shell dumpsys bluetooth_manager`（子项依版本变化）

## 6. 关联阅读

- `/notes/android/05-kernel/03-attack-surface`（驱动与协议栈接口同样属于攻击面）

## 参考（AOSP）
- https://source.android.com/docs/core/connect — Android 连接子系统总览入口（含蓝牙/NFC/Wi‑Fi 等）。
- https://source.android.com/docs/core/ota/modular-system/bluetooth — 蓝牙 Mainline 模块说明（边界、APEX 形式、更新动机）。
- https://source.android.com/docs/security/bulletin — 安全公告入口：用于追溯蓝牙相关漏洞的补丁时间线与版本影响范围。
