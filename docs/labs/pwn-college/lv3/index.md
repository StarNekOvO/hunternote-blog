# pwn.college lv3（黄色腰带）Program Security

黄色：更复杂的保护 & 漏洞类型

## 主线目标

在现代防护（ASLR/NX/PIE 等）下，仍能完成利用。

## 典型内容

### 会碰到的防护：
- 更严格的栈保护、PIE、部分/完全 RELRO
- GOT/PLT、动态链接器的一些细节
- format string、信息泄露配合 ROP 等
- 更复杂的 ROP 链、返回到特定 gadget

这里汇编阅读更频繁，但仍然是"写 payload 拿 flag"，不是解读汇编本身当作终点。