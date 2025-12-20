# 1x02 - 权限模型演进

Android 的权限模型经历了从“全家桶式授予”到“按需动态申请”的重大演进。它是应用沙箱在业务逻辑层面的延伸。

## 1. 权限等级 (Protection Levels)

Android 将权限分为四个主要等级，决定了系统如何授予这些权限：

- **Normal (普通权限)**: 风险较低，安装时自动授予（如访问网络、设置闹钟）。
- **Dangerous (危险权限)**: 涉及用户隐私（如摄像头、联系人、位置）。必须在运行时由用户明确授权。
- **Signature (签名权限)**: 只有当请求权限的应用与声明权限的应用签名相同时，系统才会授予。常用于系统应用间的私密通信。
- **Privileged (特权权限)**: 预装在系统分区（如 `/system/priv-app`）的应用才能申请。

## 2. 权限到 GID 的映射机制

在底层，许多权限最终会转化为 Linux 的 **GID (Group ID)**。

### 2.1 `platform.xml` 的作用
系统配置文件 `/etc/permissions/platform.xml` 定义了权限与 GID 的映射关系：

```xml
<permission name="android.permission.INTERNET" >
    <group gid="inet" />
</permission>
<permission name="android.permission.READ_EXTERNAL_STORAGE" >
    <group gid="sdcard_r" />
</permission>
```

当应用被授予 `INTERNET` 权限时，它的进程会被加入到 `inet` 组（GID 3003）。内核根据进程的 GID 列表来决定其是否可以打开网络 Socket。

## 3. 运行时权限 (Android 6.0+)

从 Android 6.0 (API 23) 开始，危险权限不再在安装时授予，而是在应用运行时弹出对话框。

- **底层实现**: 权限状态存储在 `settings.xml` 中。当用户点击“允许”时，`PermissionManagerService` 会更新该应用的权限位。
- **撤销机制**: 用户可以随时在设置中撤销权限。系统会通过重启应用进程来确保权限变更立即生效（因为 GID 列表只能在进程创建时设置）。

## 4. 权限审计：`dumpsys package`

安全研究员可以使用 `adb` 工具快速查看应用的权限状态：

```bash
# 查看特定应用的权限授予情况
adb shell dumpsys package com.example.app | grep -A 20 "requested permissions"
```

输出示例：
```text
requested permissions:
  android.permission.CAMERA
  android.permission.RECORD_AUDIO
install permissions:
  android.permission.INTERNET: granted=true
runtime permissions:
  android.permission.CAMERA: granted=false, flags=[ USER_SET ]
  android.permission.RECORD_AUDIO: granted=true, flags=[ USER_SET ]
```

## 5. 权限校验流程：从 `checkPermission` 到 PMS

当应用尝试执行敏感操作（如 `startActivity`）时，系统会进行权限校验：

1. **API 调用**: 应用调用 Framework 接口。
2. **ContextImpl**: 内部调用 `checkPermission()`。
3. **ActivityManagerService (AMS)**: 跨进程请求 AMS 进行校验。
4. **PermissionManagerService (PMS)**: AMS 最终查询 PMS。PMS 会检查内存中的权限表，判断该 UID 是否拥有目标权限。
5. **结果返回**: 如果未授权，抛出 `SecurityException`。

## 6. CVE 案例分析：CVE-2021-0691 (权限绕过)

该漏洞存在于 `PermissionController` 组件中。

- **成因**: 在处理某些特定权限的自动授予逻辑时，系统未能正确校验请求方的包名与 UID 的对应关系。
- **影响**: 攻击者可以构造一个虚假的包名，诱导系统为其授予本不该拥有的危险权限，从而实现隐私窃取。
- **修复**: 强化了对调用方身份的二次校验，确保权限授予逻辑的原子性。

## 参考（AOSP）

- https://source.android.com/docs/core/permissions — Android 权限架构总览：权限类型、声明与检查机制。
- https://source.android.com/docs/core/permissions/runtime_perms — 运行时权限：实现细节、UID 映射与权限组。
- 应用沙盒（权限与 UID/DAC、SELinux、存储等保护机制的整体关系）：https://source.android.com/docs/security/app-sandbox
- 架构概览（系统服务/框架层与系统 API 的层级关系）：https://source.android.com/docs/core/architecture
