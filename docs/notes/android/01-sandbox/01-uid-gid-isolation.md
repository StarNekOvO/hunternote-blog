# UID/GID 隔离深度解析

> 本文属于 [Android 沙箱机制](./index.md) 系列文章。

## 核心要点
- AID (Android ID) 定义与分配机制
- `installd` 源码分析：应用安装时的 UID 分配流程
- 多用户隔离实现 (AID_USER_OFFSET)
- SharedUserId 的历史、风险与废弃原因

## CVE 案例分析
- **CVE-2018-9468**: SharedUserId 签名验证绕过

---
## 待编写内容
- [ ] 梳理 `android_filesystem_config.h` 中的关键 AID。
- [ ] 分析 `installd` 如何调用 `chown` 设置私有目录权限。
- [ ] 构造 SharedUserId 漏洞的复现环境。
