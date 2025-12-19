# 权限模型演进

> 本文属于 [Android 沙箱机制](./index.md) 系列文章。

## 核心要点
- 权限类型：Normal, Dangerous, Signature, Privileged
- 权限到 GID 的映射机制 (`platform.xml`)
- 运行时权限 (Android 6.0+) 的底层实现
- Permission Controller 与权限授予流程

## CVE 案例分析
- **CVE-2021-0691**: 权限绕过漏洞分析

---
## 待编写内容
- [ ] 演示如何通过 `adb shell dumpsys package` 查看应用权限状态。
- [ ] 梳理从 `checkPermission` 到 `PermissionManagerService` 的调用链。
