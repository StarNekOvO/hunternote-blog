# 存储隔离 (Scoped Storage)

> 本文属于 [Android 沙箱机制](./index.md) 系列文章。

## 核心要点
- 存储权限演进：从全局读写到 Scoped Storage
- MediaStore API 与 Fuse/Sdcardfs 挂载机制
- Storage Access Framework (SAF)
- FileProvider 的安全配置

## CVE 案例分析
- 路径遍历与符号链接攻击案例

---
## 待编写内容
- [ ] 对比 Android 9 与 Android 11 在 `/sdcard` 访问权限上的差异。
- [ ] 编写一个安全的 FileProvider 配置示例。
