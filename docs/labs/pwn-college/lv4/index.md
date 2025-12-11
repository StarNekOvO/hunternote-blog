# pwn.college lv4（绿色腰带）System Security

绿色：堆 / 更高级的内存利用 & 沙箱思路

## 主线目标

理解堆分配器行为和更高级的利用思路。

## 典型内容

### 常见方向：
- glibc malloc 模型、chunk 布局
- UAF / double free / heap overflow
- tcache / fastbin 等利用思路
- 可能会结合一些简单的沙箱或 syscall 限制，要求你"想办法在约束下构造利用"

这里就会开始有那种"先用信息泄露 → 泄 libc / heap 地址 → 再构造写任意指针"的链条。