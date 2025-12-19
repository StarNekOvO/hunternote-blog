# Zygote 与进程创建

> 本文属于 [Android 沙箱机制](./index.md) 系列文章。

## 核心要点
- Zygote 启动流程与 Socket 通信
- `fork` + `specialize` 机制详解
- 凭证设置：`setresuid` / `setresgid` / `capset`
- App Zygote 与 WebView Zygote 的隔离增强

## CVE 案例分析
- **CVE-2020-0096**: StrandHogg 2.0 (Activity 栈劫持)

---
## 待编写内容
- [ ] 跟踪 `ZygoteConnection.java` 处理 fork 请求的流程。
- [ ] 解释 Linux Capabilities 是如何被丢弃的。
