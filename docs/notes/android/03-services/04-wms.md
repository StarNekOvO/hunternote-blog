# 3x03 - WindowManagerService (WMS)

WMS 负责管理屏幕上的所有窗口及其显示顺序。

它是 UI 安全研究绕不开的一层：窗口的层级、可见性、触摸事件归属、截屏/录屏保护、Overlay 限制，很多都在 WMS/输入系统的协作里完成。

## 1. 核心职责
- **窗口层级**: 决定哪个窗口在最前面。
- **输入分发**: 将触摸事件传递给正确的窗口。

补充几个关键协作对象：

- **SurfaceFlinger**：最终合成显示（更偏 native 层）
- **InputManagerService (IMS)**：输入事件的 native/Java 桥接与分发
- **ATMS/AMS**：任务与前后台状态会影响窗口可见性与焦点

## 2. 安全研究重点
- **悬浮窗攻击 (Overlay Attack)**: 恶意应用覆盖在合法应用之上，诱导用户点击或输入密码。
- **截屏与录屏**: 绕过 `FLAG_SECURE` 保护。

## 3. 窗口与输入链路（概念模型）

### 3.1 窗口类型与层级

研究 overlay 时必须先搞清窗口类型（名称随版本有变化，概念一致）：

- 应用窗口（普通 Activity）
- 系统窗口（状态栏、导航栏、IME 等）
- Overlay（例如 `TYPE_APPLICATION_OVERLAY`，需要 `SYSTEM_ALERT_WINDOW` 权限）

层级/优先级决定：

- 视觉上谁覆盖谁
- 输入焦点属于谁

### 3.2 输入事件分发

触摸事件大致路径：

- 内核输入设备 → native 输入 reader
- IMS 处理并通过策略决定目标窗口
- 将事件派发到对应窗口/应用进程

安全研究常见切入点：

- “看得见但点不到”是否发生（遮挡检测/防点击劫持机制）
- 输入目标与可见窗口是否一致（异常情况可能引发 UI 欺骗）

## 4. Overlay（点击劫持/钓鱼）的关键点

### 4.1 典型攻击

- 恶意 overlay 覆盖在授权对话框上，诱导用户点“允许”
- 使用透明/半透明窗口制造错觉
- 配合 Accessibility 做自动化点击/填充

### 4.2 系统侧防护（应该检查什么）

- Overlay 权限管控（`SYSTEM_ALERT_WINDOW`）与前台限制
- 对“敏感窗口”的遮挡检测（例如输入密码、授权弹窗）
- 对 Accessibility 的风险控制（它经常与 overlay 联动）

### 4.3 `FLAG_SECURE` 的语义边界

`FLAG_SECURE` 的目标是防止系统截图/录屏把窗口内容采集走。

研究时注意两类边界：

- **采集路径差异**：系统截图 vs 第三方投屏/采集链路
- **合成层级**：某些内容可能在 surface 合成前后出现不同可见性

## 5. dumpsys 与排查

### 5.1 快速查看窗口信息

- `adb shell dumpsys window`（最常用）
- `adb shell dumpsys window windows`（窗口列表/焦点/可见性）
- `adb shell dumpsys SurfaceFlinger`（更底层的 surface 视角）

### 5.2 常用 log tag

- `WindowManager`
- `InputManager`
- `SurfaceFlinger`

## 6. 关联阅读

- `/notes/android/03-services/02-ams`（任务栈与前后台状态对窗口的影响）
- `/notes/android/04-native/03-seccomp`（SurfaceFlinger/多媒体进程的 syscall 限制）

## 参考（AOSP）

- 架构概览（系统服务、SurfaceFlinger 等组件的层级位置）：https://source.android.com/docs/core/architecture
- SELinux（domain/策略调试入口，便于对照窗口/输入相关进程域隔离）：https://source.android.com/docs/security/features/selinux
