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

## 4. 代表性CVE案例

### 4.1 CVE-2017-13156 (Janus签名绕过)

**根因**：V1签名未覆盖整个APK，DEX文件可被附加在APK头部

**攻击链**：
```text
1. 创建合法签名的恶意APK
2. 在APK文件头部附加恶意DEX
3. PMS签名验证通过(仅检查ZIP部分)
4. DexClassLoader加载头部DEX(未被签名保护)
5. 执行恶意代码
```

**修复**：增强APK解析，拒绝包含额外DEX的包

### 4.2 CVE-2020-0034 (权限持久化)

**根因**：包更新时权限撤销逻辑错误

**触发**：
```text
1. 恶意应用请求危险权限并获得授权
2. 应用卸载但保留数据
3. 同签名的新版本安装
4. 权限意外被保留(应该重新请求)
```

**影响**：权限提升，用户无感知授权

### 4.3 CVE-2021-0478 (PackageInstaller提权)

**位置**：PackageInstaller权限检查

**根因**：安装会话创建时的调用者UID检查不足

**影响**：无权限应用可安装任意包

### 4.4 CVE-2021-0921 (Signature Spoofing)

**根因**：APK签名解析时对V2/V3 block处理不当

**触发**：精心构造的APK signing block可绕过签名检查

**影响**：恶意应用可伪装成系统应用签名

## 5. 安装/更新的主链路（概念层）

不同版本实现差别较大，但可以用下面的框架理解：

1. **输入来源**：PackageInstaller / `pm install` / 系统 OTA
2. **解析与校验**：manifest、SDK 版本、ABI、`uses-feature`、签名
3. **准备安装会话**：写入临时目录、校验摘要
4. **提交与原子切换**：移动到最终路径，更新 settings
5. **广播与优化**：发安装广播、触发 dexopt/编译等

审计安全时重点盯：

- “校验对象”是否与“最终安装对象”一致（是否存在替换窗口）
- 任何可以影响安装目标路径/包名/签名决策的参数

## 6. 签名验证要点（研究必备）

### 6.1 V1/V2/V3 的关键差异

- **V1 (JAR)**：对条目做签名，历史上出现过利用 ZIP 结构歧义的绕过
- **V2/V3**：对整个 APK 做更强的一致性保护（但实现/解析错误仍可能出现）

### 6.2 在源码里通常会遇到的对象

- “包的签名细节”对象（例如 `SigningDetails` 类似概念）
- “签名比对/继承/轮换”逻辑（key rotation）

审计时关注：

- 升级路径是否允许“更弱”的签名集合
- 是否存在 debug/测试开关影响签名强度

## 7. 权限授予与特权白名单

### 7.1 运行时权限与默认授权

现代系统中，权限授予分层较多（PMS + PermissionManager + AppOps），但 PMS 仍然是“声明源”。

### 7.2 privileged app 与 `privapp-permissions`

特权应用（`/system/priv-app`）常通过白名单文件被授予敏感权限。

研究/排查时要注意：

- 白名单文件与包名是否匹配
- 设备厂商定制是否额外扩权

## 8. 现场排查命令

- 查看包列表：`adb shell pm list packages`
- 查看某包详细信息：`adb shell dumpsys package <package>`
- 查看权限：`adb shell dumpsys package <package> | grep -i permission -n`
- 查看安装路径与 ABI：`adb shell pm path <package>`

与数据文件相关的常见位置（Root/工程机更常用）：

- `/data/system/packages.xml`（包与 uid/flag 的持久化记录之一）
- `/data/system/users/<id>/package-restrictions.xml`（用户维度安装状态/禁用状态等）

## 参考（AOSP）

- 应用签名（v1/v2/v3/v4、shared UID 废弃口径）：https://source.android.com/docs/security/features/apksigning
- 应用沙盒（签名与 UID/沙盒边界的关系背景）：https://source.android.com/docs/security/app-sandbox
- 架构概览（系统服务与框架层级）：https://source.android.com/docs/core/architecture
