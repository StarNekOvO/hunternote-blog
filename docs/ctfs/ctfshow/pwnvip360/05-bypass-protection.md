# Bypass安全机制 (111-134)

该模块学习如何绕过各种编译时和运行时的安全保护机制。

## 保护机制

- RELRO (Relocation Read-Only)
- Stack Canaries (金丝雀保护)
- No-execute (NX)
- ASLR和PIE
- FORTIFY_SOURCE

## 绕过技术

- No RELRO、Partial RELRO、Full RELRO的差异利用
- 覆盖低字节泄露canary
- 格式化字符串泄露canary
- SSP Leak
- 劫持_stack_chk_fail函数
- one_by_one爆破canary
- 覆盖TLS中储存的canary值
- C++异常机制绕过canary
- 栈地址任意写绕过canary检查
- 数组下标越界
- No NX和NX绕过
- 地址空间布局随机化绕过
- 位置无关可执行代码利用
- 危险函数替换机制

## 靶场记录

<!-- 靶场111-134的笔记将记录在这里 -->