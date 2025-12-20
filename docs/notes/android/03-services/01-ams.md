# 3x01 - ActivityManagerService (AMS)

AMS 是 Android 的“总调度室”，负责管理所有组件的生命周期和进程调度。

从研究角度看，AMS/ATMS 是连接“应用行为”与“系统决策”的关键节点：启动组件、拉起进程、切换前后台、广播分发、服务绑定等都要经过它。

## 1. 核心职责
- **进程管理**: 决定何时启动或杀死进程。
- **组件启动**: 处理 `startActivity`, `startService`, `sendBroadcast` 等请求。
- **权限校验**: 在执行敏感操作前，调用 `checkPermission`。

补充：Android 10+ 以后，Activity 相关的部分很多迁移到了 `ActivityTaskManagerService (ATMS)`，但“入口在 AMS/ATMS，状态在 system_server”这一点不变。

## 2. 安全研究重点
- **Intent 转发漏洞**: 恶意应用诱导 AMS 以系统权限发送 Intent。
- **Activity 栈劫持**: 利用 `taskAffinity` 伪造界面。
- **PendingIntent 提权**: 滥用可变的 PendingIntent。

## 3. 典型调用链（从 App 到 AMS/ATMS）

### 3.1 启动 Activity

大致链路（不同版本类名略有差异）：

- App: `Context.startActivity()`
- Framework: `Instrumentation.execStartActivity()`
- Binder: `IActivityTaskManager` / `IActivityManager`
- system_server: `ActivityTaskManagerService` 负责任务/栈决策
- 最终落到 `ActivityStarter`/`ActivityStartController` 做解析与启动

研究时建议关注：

- **Intent 解析与重写**：是否发生了 `Intent` 的重写（component/flags/clipdata）
- **导出检查**：`exported` / `permission` / `IntentFilter` 的匹配
- **跨用户**：`startActivityAsUser` 的校验路径

### 3.2 启动 Service / Bind Service

- App: `Context.startService()` / `bindService()`
- Binder 到 AMS
- AMS 内部通常由 `ActiveServices` 维护 Service 记录并调度

安全关注点常见在：

- 后台启动限制（Android 8+）与绕过路径
- `foreground service` 启动与通知相关逻辑
- 绑定回调（`ServiceConnection`）的身份与生命周期处理

### 3.3 广播分发

- App: `sendBroadcast()`
- AMS: 进入广播队列（历史上有 `BroadcastQueue` 等实现）
- 根据注册/静态声明分发到目标

广播常见风险：

- **隐式广播**、**Sticky broadcast** 的历史遗留行为
- 接收方/发送方权限声明不一致导致的信息泄漏或越权

## 4. 代表性CVE案例

### 4.1 CVE-2017-0692 (PendingIntent权限提升)

**根因**：系统组件创建的PendingIntent未设置`FLAG_IMMUTABLE`

**攻击链**：
```text
1. 恶意应用向系统组件发送精心构造的请求
2. 系统组件创建PendingIntent并传递给恶意应用
3. 恶意应用修改Intent的action/component
4. 触发PendingIntent时以系统权限执行恶意操作
```

**缓解**：Android 12+默认要求`FLAG_IMMUTABLE`

### 4.2 CVE-2018-9489 (Activity劫持)

**根因**：`taskAffinity`与`allowTaskReparenting`配合的UI欺骗

**场景**：
```xml
<!-- 恶意应用manifest -->
<activity 
    android:name=".FakeActivity"
    android:taskAffinity="com.victim.app"
    android:allowTaskReparenting="true">
</activity>
```

**影响**：用户以为在使用银行应用，实际已被切换到钓鱼界面

### 4.3 CVE-2021-0306 (Broadcast权限绕过)

**位置**：AMS广播分发逻辑

**根因**：某些系统广播的权限检查可被绕过

**影响**：未授权应用可接收敏感系统广播(如电话状态/位置更新)

### 4.4 CVE-2021-0921 (Service启动限制绕过)

**根因**：后台启动Service的白名单检查不完整

**触发**：通过特定Intent flag组合绕过Android 8+的后台启动限制

## 5. 常见漏洞模式清单（审计 checklist）

- **身份与权限**
	- 是否在进入敏感分支前做了 `enforceCallingPermission` / `AppOps`
	- 是否存在 `clearCallingIdentity()` 后使用了调用方可控参数
- **Intent/PendingIntent**
	- `PendingIntent` 是否要求 `FLAG_IMMUTABLE`
	- `Intent` 的 component 是否被正确固定/校验
	- `ClipData`/URI 权限是否被意外传播
- **任务栈/UI 欺骗**
	- `taskAffinity`、`allowTaskReparenting`、`launchMode` 的组合
	- 前台切换与 overlay 的协同攻击（与 WMS/输入分发相关）
- **DoS 面**
	- 极端参数导致的状态爆炸（大量 task/大量 service/大量 broadcast）
	- ANR/死锁风险点（锁顺序、回调重入）

## 6. 调试与排查

### 6.1 dumpsys 常用项

- 查看 Activity/任务：`adb shell dumpsys activity activities`
- 查看进程：`adb shell dumpsys activity processes`
- 查看广播：`adb shell dumpsys activity broadcasts`
- 查看 service：`adb shell dumpsys activity services`

### 6.2 logcat 关键 tag

- `ActivityManager`（进程/组件）
- `ActivityTaskManager`（任务/栈）
- `WindowManager`（与 WMS 交叉定位）

### 6.3 逆向/审计切入点建议

- 先从 AIDL 入口（`IActivityManager` / `IActivityTaskManager`）定位实现类
- 再从"敏感能力"回溯：组件启动、跨用户、授予 URI 权限、前台切换
- 最后落到具体写入点：任务记录、权限授予、进程管理决策

## 参考（AOSP）

- 架构概览（system_server/系统服务的总体定位）：https://source.android.com/docs/core/architecture
- AIDL 概览（跨进程交互的官方入口与调试命令）：https://source.android.com/docs/core/architecture/aidl
