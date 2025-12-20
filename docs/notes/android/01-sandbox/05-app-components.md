# 四大组件安全

四大组件是“应用能力的边界定义”：哪些能力对外开放、以什么身份执行、以及外部输入如何进入应用逻辑。

从漏洞类型上看，很多 Android AppSec 问题都可以归到下面三类：

1. **外部输入进入组件**：Intent/URI/Bundle 作为不可信输入进入业务。
2. **组件以谁的身份执行**：调用方身份（caller UID）与组件进程身份（app UID）的混淆。
3. **能力被转授**：`PendingIntent`、URI grants、Binder token 等把权限交给其它组件

## 1. 核心要点（按组件）

- **Activity**：Intent 劫持、Deep Link 参数注入、任务栈/界面欺骗（`taskAffinity` 等）。
- **Service**：导出服务滥用、绑定回调注入、后台启动限制与绕过、`isolatedProcess` 的隔离策略。
- **BroadcastReceiver**：隐式广播泄漏、权限保护不足、Sticky/动态注册导致的边界问题。
- **ContentProvider**：SQL 注入、路径遍历、URI 权限授予（`grantUriPermissions`/`FLAG_GRANT_*`）、FileProvider 误配。

## 2. 一条最重要的主线：`exported` 与入口清点

审计时第一步永远是回答：组件是否对外可达？

- **显式声明 `android:exported="true"`**：外部可直接访问。
- **存在 `intent-filter` 但未声明 exported**：Android 12 起会安装失败（系统强制明确表态）。
- **Provider 的对外访问**：还涉及 `android:grantUriPermissions`、`android:readPermission/writePermission`、以及 `path-permission`。

快速枚举思路（工程机/调试环境常用）：

- `adb shell dumpsys package <package>` 查看组件与导出信息
- `adb shell cmd package resolve-activity` / `resolve-service`（不同版本命令支持不同）

## 3. Activity：从“参数注入”到“界面欺骗”

### 3.1 Intent 劫持

隐式 Intent 发送敏感信息时，如果攻击者注册更匹配的 `IntentFilter`，可能接收到数据。

最常见的风险场景：

- 分享/打开文件（`ACTION_SEND`/`ACTION_VIEW`）带了敏感 `EXTRA_*`
- 自定义 action 未限制 package

防御建议：

- 尽量使用显式 Intent（`setClassName`/`ComponentName`）
- 或至少 `setPackage()` 约束接收方
- 对返回结果（`startActivityForResult` 类似流程）做来源校验

### 3.2 任务栈与 UI 欺骗（高频落点）

研究 `taskAffinity`/`launchMode`/`excludeFromRecents` 的组合，通常是在看：

- 能否把恶意 Activity 放到“看起来像系统/银行”的栈里
- 能否利用切换时机让用户误操作

这里经常与 WMS/输入系统联动（overlay、焦点窗口、可见性）。

## 4. Service：导出能力与执行身份

### 4.1 导出 Service 的典型问题

- 外部调用 `startService/bindService` 进入敏感逻辑
- 没有校验调用方（UID/签名/权限）
- 把外部输入当成“内部可信请求”处理

建议的最小审计 checklist：

- 入口处是否做了调用方校验（权限、签名校验、包名白名单）
- 是否存在 `clearCallingIdentity()` 后使用 caller 可控参数做写入/执行
- 是否有敏感能力：文件读写、动态加载、命令执行、账号/令牌访问

### 4.2 使用 `isolatedProcess="true"` 加固 Service

对处理不可信数据（解析复杂文件、脚本、解码器、反序列化等）的 Service，`isolatedProcess` 是“减灾工具”而不是“万能安全”。

- **机制**：运行在独立进程，权限极少，且无法直接访问应用私有目录。
- **适用场景**：高风险输入、可被远程触发的解析逻辑。
- **注意点**：仍然需要控制 IPC 接口本身（否则攻击者可以把 isolated process 当成 DoS/信息泄露入口）。

## 5. BroadcastReceiver：入口多、链路短

广播漏洞通常很“朴素”，但影响面大：

- **信息泄露**：敏感信息被放进无保护的系统/应用广播。
- **越权触发**：导出 receiver 接收外部广播后执行敏感逻辑。

防御建议：

- 对敏感广播加权限（`android:permission` 或发送时 `sendBroadcast(intent, permission)`）
- 对 receiver 入口做 caller 校验（尤其是动态注册场景）

## 6. ContentProvider：最容易被“配置错误”击穿

### 6.1 SQL 注入与查询滥用

风险来源：

- `query()` 里直接拼接 selection / sortOrder
- `update/delete` 缺少 where 条件导致全表修改

审计建议：

- 确认是否使用参数化 selection（`selectionArgs`）
- 确认是否对列名、排序字段做白名单

### 6.2 `grantUriPermissions` 的漏洞模式

ContentProvider 是共享数据的核心。常见配置链路是：

- Provider：`android:grantUriPermissions="true"`
- 调用方：`Intent.FLAG_GRANT_READ_URI_PERMISSION` 或 `FLAG_GRANT_WRITE_URI_PERMISSION`

漏洞成因通常是：

- Provider 对 URI 路径缺少严格校验
- 或把可控 path 映射到文件系统路径时未规范化（路径遍历）
- 或错误地授予了“目录级/过宽范围”的 URI 权限

防御建议：

- 能不用就不用 `grantUriPermissions`
- 必须用时，用 `path-permission` 做细粒度控制
- 对 URI 做规范化并限制允许的路径集合

### 6.3 `FileProvider` 常见坑

- `paths.xml` 配得过宽（把整个外部存储、整个 data 目录暴露）
- 以为“content://”天然安全，但实际关键在于“能否解析到不该读的文件”

## 7. 调试与验证（实战常用）

- 枚举导出组件：`adb shell dumpsys package <package> | sed -n '/Activities:/,/Services:/p'`
- 触发 Activity：`adb shell am start -n <pkg>/<cls> -a <action> -d <uri>`
- 触发 Broadcast：`adb shell am broadcast -a <action> --es k v`
- 触发 Service：`adb shell am startservice -n <pkg>/<cls>`

验证思路：

- 用最小输入触发入口 → 观察 logcat/dumpsys → 再逐步增加攻击载荷
- 重点记录：入口是否可达、是否校验 caller、是否发生身份切换、最终敏感操作点在哪里

## 8. CVE 案例（典型类型）

- **CVE-2018-9581**：Broadcast 信息泄露。系统广播包含敏感信息且缺少权限保护，导致第三方应用可监听。

## 参考（AOSP）

- 应用沙盒（共享文件指南、Provider/SAF/MediaStore 相关安全建议入口）：https://source.android.com/docs/security/app-sandbox
- 架构概览（系统服务/框架与应用边界）：https://source.android.com/docs/core/architecture
