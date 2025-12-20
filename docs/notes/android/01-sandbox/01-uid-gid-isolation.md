# 1x00 - UID/GID 隔离深度解析

Android 安全模型的核心建立在 Linux 的 **DAC (Discretionary Access Control, 自主访问控制)** 机制之上。在传统的 Linux 系统中，UID (User ID) 用于区分不同的用户；而在 Android 中，UID 被创造性地用于区分不同的**应用程序**。

这就是所谓的“应用沙箱”的第一道防线。

## 1. Android ID (AID) 机制

在 Android 中，每一个安装的应用都会被分配一个唯一的 UID，称为 **AID (Android ID)**。

### 1.1 AID 的分配范围
Android 在 `system/core/include/private/android_filesystem_config.h` 中定义了 AID 的分配规则：

- **System UID (0 - 999)**: 预留给内核和核心系统进程（如 `root`, `system`, `radio`, `bluetooth`）。
- **App UID (10000 - 19999)**: 分配给普通安装的应用。
- **Isolated UID (99000 - 99999)**: 用于隔离进程（如 Chrome 的渲染进程），这些进程权限极低。

### 1.2 映射关系
当应用安装时，`PackageManagerService` (PMS) 会为其分配一个未使用的 AID。这个映射关系持久化在 `/data/system/packages.xml` 中：

```xml
<package name="com.example.app" codePath="/data/app/..." ... userId="10123">
    <sigs count="1">
        <cert index="0" key="..." />
    </sigs>
</package>
```

在 Linux 内核看来，`com.example.app` 就是一个名为 `u0_a123` 的用户（假设是 User 0）。

## 2. `installd` 与目录权限设置

应用安装后，系统需要为其创建私有数据目录（`/data/data/<pkg_name>`）。这个过程是由高权限守护进程 `installd` 完成的。

### 2.1 源码简析
在 `frameworks/native/cmds/installd/InstalldNativeService.cpp` 中，`createAppData` 函数负责设置目录权限：

```cpp
// 简化代码片段
auto path = create_data_user_ce_package_path(uuid, userId, pkgname);
if (fs_prepare_dir_strict(path, 0751, uid, gid) != 0) {
    return error("Failed to prepare " + path);
}
```

- **权限 0751**: 只有所有者（该应用）拥有读写执行权限，其他用户（其他应用）只有执行权限（用于进入目录，但不能列出文件）。
- **所有者 (uid/gid)**: 设置为该应用被分配的 AID。

这种机制确保了即使应用 A 知道应用 B 的路径，也无法读取其内容，因为 Linux 内核会在文件系统层级拦截越权访问。

## 3. SharedUserId 的“原罪”

在 Android 早期，为了方便同一开发者的多个应用共享数据，引入了 `android:sharedUserId` 属性。

### 3.1 机制
如果两个应用声明了相同的 `sharedUserId` 并且使用相同的证书签名，它们将共享同一个 UID。这意味着：
1. 它们可以互相访问对方的私有数据目录。
2. 它们运行在同一个进程中（如果指定了相同的 `android:process`）。

### 3.2 安全风险
`sharedUserId` 极大地破坏了沙箱的隔离性。如果其中一个应用存在漏洞（如文件遍历），攻击者可以轻易获取另一个应用的所有敏感数据。

**注意**：AOSP 官方口径是从 Android 13 起废弃“共用 UID”（Shared UID）。实际设备/应用是否还能使用，取决于目标版本与兼容性策略；跨应用共享能力更推荐使用 `ContentProvider`/`Service` 等显式 IPC 机制。

## 4. CVE 案例分析：CVE-2018-9468

这是一个典型的利用 `sharedUserId` 机制缺陷实现的沙箱绕过漏洞。

### 4.1 漏洞背景
在某些 Android 版本中，`PackageManagerService` 在处理 `sharedUserId` 的签名验证时存在逻辑缺陷。

### 4.2 攻击路径
1. 攻击者安装一个声明了 `sharedUserId="android.uid.system"` 的恶意应用。
2. 正常情况下，PMS 会检查该应用是否拥有系统签名。
3. 由于验证逻辑的漏洞，攻击者可以通过特定的 APK 结构绕过签名检查。
4. 一旦安装成功，恶意应用将获得 `system` 权限，从而彻底突破沙箱，控制整个系统。

### 4.3 修复
Google 修复了 PMS 中关于 `sharedUserId` 签名校验的边界条件，并进一步收紧了对系统 UID 共享的限制。

## 5. 边界与局限性：为什么仅有 UID 隔离是不够的？

虽然 UID/GID 提供了基础的隔离，但在复杂的 Android 环境中，它并非万能。

### 5.1 Root 用户的特殊性
在 Linux 传统权限模型中，UID 0 (root) 拥有最高权限，可以绕过所有的 DAC 检查。
- **背景**: 许多系统守护进程（如 `vold`, `netd`）需要以 root 身份运行以执行底层操作。
- **风险**: 一旦 root 进程被攻破，整个 DAC 隔离将形同虚设。
- **结果**: Android 引入了 **SELinux (MAC)** 来限制 root 进程。即使是 root，也只能访问其安全策略（Policy）允许的资源。此外，通过 **Capabilities** 机制，系统可以只赋予进程必要的特权，而非完整的 root 权限。

### 5.2 权限放宽的风险
如果应用开发者错误地使用了 `chmod 777` 或 `Context.MODE_WORLD_READABLE`（已废弃），会发生什么？
- **分析**: 虽然应用可以放宽其私有目录的 DAC 权限，但现代 Android 还有其他保护层。
- **结果**: 
    1. **父目录限制**: `/data/data` 目录通常对普通应用不可列出。
    2. **SELinux 拦截**: 即使文件权限允许，SELinux 策略通常也会禁止一个应用进程访问另一个应用标签（Label）下的文件。
    3. **API 限制**: 从 Android 7.0 开始，系统严禁通过 `FileUriExposedException` 传递私有文件，强制开发者使用 `FileProvider`。

## 6. 总结

UID/GID 隔离是 Android 沙箱的基石，它利用 Linux 成熟的 DAC 机制实现了应用间的初步隔离。然而，随着系统复杂性的增加，单纯依靠 UID 已经无法应对 Root 提权、内核漏洞以及复杂的权限共享需求。因此，现代 Android 引入了 SELinux、Capabilities 和 Scoped Storage 等机制，构建了一套多层级的纵深防御体系。

对于安全研究员而言，理解 UID 映射和 `installd` 的权限设置逻辑，是分析应用数据泄露和提权漏洞的起点。

UID/GID 隔离是 Android 沙箱的底层基石。它利用成熟的 Linux DAC 机制，以极低的性能开销实现了应用间的数据隔离。

然而，随着系统复杂度的增加，单纯依靠 UID 已经不足以应对现代安全挑战。这也是为什么 Android 后来引入了 **SELinux (MAC)** 和 **Scoped Storage** 的原因——它们将在后续章节中详细讨论。

## 延伸阅读
- [Android Source: Permissions and UID](https://source.android.com/docs/security/app-sandbox)
- [CVE-2018-9468 Detail](https://nvd.nist.gov/vuln/detail/CVE-2018-9468)

## 参考（AOSP）

- 应用沙盒（UID 隔离与演进、共享文件建议等）：https://source.android.com/docs/security/app-sandbox
- SELinux（作为应用沙盒的纵深防御组成）：https://source.android.com/docs/security/features/selinux
