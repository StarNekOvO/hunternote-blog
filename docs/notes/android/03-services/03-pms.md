# 3x02 - PackageManagerService (PMS)

PMS 负责管理系统中所有的安装包（APK）及其权限。

它解决的核心问题是：

- “这个包是谁？”（包名、uid、签名、版本、组件清单）
- “这个包能做什么？”（权限、AppOps、privileged 白名单、签名权限）
- “系统如何在多用户下维护这些映射？”（userId/appId、profile 安装状态）

## 1. 核心职责
- **解析 APK**: 读取 `AndroidManifest.xml`。
- **权限管理**: 维护 UID 与权限的映射关系。
- **签名验证**: 确保应用升级时的签名一致性。

补充：现代 Android 的权限体系已经拆分出 `PermissionManagerService` 等组件，但“包信息与签名真实性”仍然是 PMS 的底座。

## 2. 安全研究重点
- **签名绕过**: 历史上的 V1/V2 签名漏洞。
- **权限提升**: 通过修改 `packages.xml` 或利用 PMS 逻辑漏洞获取特权。
- **安装包劫持**: 在安装过程中替换 APK 文件。

## 3. PMS 视角的数据模型

### 3.1 包、UID 与用户

几个容易混淆的概念：

- `packageName`：逻辑身份
- `appId`：系统分配给应用的基础 id（跨用户共享）
- `uid = userId * 100000 + appId`：最终在 Linux 层体现的 UID（规则会随版本调整，但“按用户空间偏移”不变）

很多越权问题本质是：把 `uid/appId/userId` 混用导致跨用户访问。

### 3.2 组件与导出

PMS 会解析并记录四大组件及其导出信息：

- `Activity`
- `Service`
- `Receiver`
- `Provider`

Android 12 起，若组件声明 `intent-filter` 但未显式声明 `android:exported` 会直接安装失败，这属于“从构建期/安装期强制纠错”。

## 4. 安装/更新的主链路（概念层）

不同版本实现差别较大，但可以用下面的框架理解：

1. **输入来源**：PackageInstaller / `pm install` / 系统 OTA
2. **解析与校验**：manifest、SDK 版本、ABI、`uses-feature`、签名
3. **准备安装会话**：写入临时目录、校验摘要
4. **提交与原子切换**：移动到最终路径，更新 settings
5. **广播与优化**：发安装广播、触发 dexopt/编译等

审计安全时重点盯：

- “校验对象”是否与“最终安装对象”一致（是否存在替换窗口）
- 任何可以影响安装目标路径/包名/签名决策的参数

## 5. 签名验证要点（研究必备）

### 5.1 V1/V2/V3 的关键差异

- **V1 (JAR)**：对条目做签名，历史上出现过利用 ZIP 结构歧义的绕过
- **V2/V3**：对整个 APK 做更强的一致性保护（但实现/解析错误仍可能出现）

### 5.2 在源码里通常会遇到的对象

- “包的签名细节”对象（例如 `SigningDetails` 类似概念）
- “签名比对/继承/轮换”逻辑（key rotation）

审计时关注：

- 升级路径是否允许“更弱”的签名集合
- 是否存在 debug/测试开关影响签名强度

## 6. 权限授予与特权白名单

### 6.1 运行时权限与默认授权

现代系统中，权限授予分层较多（PMS + PermissionManager + AppOps），但 PMS 仍然是“声明源”。

### 6.2 privileged app 与 `privapp-permissions`

特权应用（`/system/priv-app`）常通过白名单文件被授予敏感权限。

研究/排查时要注意：

- 白名单文件与包名是否匹配
- 设备厂商定制是否额外扩权

## 7. 现场排查命令

- 查看包列表：`adb shell pm list packages`
- 查看某包详细信息：`adb shell dumpsys package <package>`
- 查看权限：`adb shell dumpsys package <package> | grep -i permission -n`
- 查看安装路径与 ABI：`adb shell pm path <package>`

与数据文件相关的常见位置（Root/工程机更常用）：

- `/data/system/packages.xml`（包与 uid/flag 的持久化记录之一）
- `/data/system/users/<id>/package-restrictions.xml`（用户维度安装状态/禁用状态等）

## 8. 关联阅读

- `/notes/android/03-services/02-ams`（组件启动与进程管理侧的校验）
- `/notes/android/05-kernel/02-selinux`（包安装后的域与访问控制）

## 参考（AOSP）

- 应用签名（v1/v2/v3/v4、shared UID 废弃口径）：https://source.android.com/docs/security/features/apksigning
- 应用沙盒（签名与 UID/沙盒边界的关系背景）：https://source.android.com/docs/security/app-sandbox
- 架构概览（系统服务与框架层级）：https://source.android.com/docs/core/architecture
