# 2x01 - Intent 系统安全

Intent 是 Android 中最灵活的通信方式，它不仅可以用于进程间通信，还是组件间解耦的核心。

但从安全角度看，Intent 也是最常见的“输入通道”：

- Action/Data/Extras 都是可控输入
- 目标组件的选择可能由系统匹配决定（隐式 Intent）
- `PendingIntent`/URI grant 会把“身份与权限”一起带过去

## 1. 显式 Intent vs 隐式 Intent

- **显式 Intent**: 明确指定目标组件的类名。通常用于应用内部通信，安全性较高。
- **隐式 Intent**: 只声明想要执行的“动作”（Action）和“数据”（Data），由系统根据 `Intent Filter` 寻找合适的接收者。

### 安全风险：Intent 劫持
如果一个隐式 Intent 发送了敏感数据，而攻击者注册了一个优先级更高的 `Intent Filter`，系统可能会将 Intent 转发给攻击者的应用，导致信息泄露。

常见发生场景：

- `ACTION_VIEW` 打开 URL/文件时带了 token、手机号、定位等 extra
- 自定义 action 没有用 `setPackage()` 约束接收方

防御思路：

- 对敏感跳转尽量使用显式 Intent（固定 component）
- 或最少 `setPackage()` 限制候选集合
- 对返回结果/回调做来源校验（不要仅凭“看起来像”某个包名）

## 2. Intent 重定向 (Intent Redirection)

这是 Android 应用中最常见的漏洞类型之一。

- **场景**: 应用 A 接收一个来自外部的 Intent，并将其作为参数传递给 `startActivity()` 或 `sendBroadcast()`。
- **攻击**: 攻击者构造一个特殊的 Intent，诱导应用 A 去启动一个它本不该访问的私有组件（如 `com.android.settings` 中的敏感界面）。
- **防御**: 
    - 永远不要直接转发外部传入的 Intent。
    - 对目标组件进行白名单校验。
    - 使用 `PendingIntent` 时要格外小心。

更具体的“可操作”防御点：

- 外部输入的 `Intent` 只当作数据载体使用，不要把它原样喂给 `startActivity/sendBroadcast/startService`
- 如果必须转发：显式设置 component，或在转发前清理危险字段（component、flags、clipdata、selector 等）
- 对 URI 做 scheme/host/path 白名单，避免 `file://`、`content://` 被滥用

## 3. PendingIntent 的陷阱

`PendingIntent` 相当于给其他应用发放了一张“通行证”，允许它以**这个应用的身份**去执行某个动作。

- **漏洞模式**: 如果应用 A 创建了一个指向敏感组件的 `PendingIntent` 并传给应用 B，应用 B 可以修改这个 `PendingIntent` 的原始 Intent（如果它是可变的），从而实现提权。
- **现代防御**: Android 12 强制要求指定 `FLAG_IMMUTABLE` 或 `FLAG_MUTABLE`，大大减少了此类漏洞。

### 3.1 典型漏洞模式（审计 checklist）

- `PendingIntent` 指向导出组件或敏感系统组件
- 可变 `PendingIntent`（允许对 extras/action/data 做修改）
- `PendingIntent` 被交给不可信方（通知、三方 SDK、跨应用分享等）

最小化建议：

- 默认 `FLAG_IMMUTABLE`
- 只有确实需要被修改时才用 `FLAG_MUTABLE`
- 对接收方能力做约束（固定 component 或约束 package）

## 4. Deep Link 与 URI 权限（高频真实漏洞点）

### 4.1 Deep Link 的输入面

App 的 `intent-filter`（http/https scheme、自定义 scheme）相当于公开 API。

常见风险：

- 路由参数注入（`/reset?token=...` 等）
- WebView 打开外部 URL（与 WebView 安全强相关）
- 将 URI 直接映射为文件路径/业务对象 id

审计建议：

- 对 scheme/host/path 做白名单
- 对参数做类型与长度限制
- 对“敏感动作”增加二次确认或重新鉴权

### 4.2 `ClipData` 与 URI grant

`Intent` 可以携带 `ClipData`，配合 `FLAG_GRANT_READ_URI_PERMISSION/WRITE` 传播对某个 `content://` URI 的访问能力。

风险点：

- 误把“临时授权”传播给了不该拿到的接收方
- Provider 端 `grantUriPermissions`/path 校验不严导致越权读取

## 5. 与系统服务交互时的关键点

Intent 最终往往会被 AMS/ATMS/WMS 处理。

研究时常见落点：

- exported 检查与权限检查是否一致
- 跨用户启动（`startActivityAsUser`）的校验
- task/栈相关 flags 是否造成 UI 欺骗

## 6. 调试与验证

- 触发 Activity：`adb shell am start -a <action> -d <uri> --es k v`
- 触发 Broadcast：`adb shell am broadcast -a <action> --es k v`
- 查看解析结果：`adb shell cmd package resolve-activity -a <action> -d <uri>`（不同版本支持不同）

验证思路：

- 先证明“外部可达”（exported + 能匹配 intent-filter）
- 再证明“可控输入进入敏感分支”（logcat/调试点）
- 最后证明“越权/信息泄露/身份混淆”

## 4. 案例分析：CVE-2020-0096 (StrandHogg 2.0)

虽然 StrandHogg 主要利用的是 Activity 栈管理机制，但其触发往往依赖于恶意的 Intent 注入。通过伪造任务栈，攻击者可以欺骗用户在恶意界面输入敏感信息。

关联阅读：`/notes/android/03-services/02-ams` 与 `/notes/android/03-services/04-wms`。

## 参考（AOSP）

说明：AOSP 文档主要覆盖平台机制与安全模型；Intent/Deep Link 等应用侧细节通常在 Android 开发者文档更完整。这里给出与本章最相关、且位于 source.android.com 的对照入口。

- 架构概览（AMS/系统服务在 AOSP 层级中的位置）：https://source.android.com/docs/core/architecture
- 应用沙盒（共享文件/SAF、Intent 参与的存储访问路径在此页有概要描述）：https://source.android.com/docs/security/app-sandbox
