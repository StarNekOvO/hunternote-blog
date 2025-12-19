# 四大组件安全

> 本文属于 [Android 沙箱机制](./index.md) 系列文章。

## 核心要点
- **Activity**: Intent 劫持、taskAffinity 攻击
- **Service**: Isolated Process 隔离、前台服务限制
- **Broadcast**: 隐式广播限制、权限保护
- **ContentProvider**: SQL 注入、路径遍历、URI 权限授予

## CVE 案例分析
- **CVE-2018-9581**: Broadcast 信息泄露

---
## 待编写内容
- [ ] 总结 ContentProvider 常见的 `grantUriPermissions` 漏洞模式。
- [ ] 演示如何利用 `isolatedProcess="true"` 进一步加固 Service。
