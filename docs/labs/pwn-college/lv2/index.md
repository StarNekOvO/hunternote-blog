# pwn.college lv2（橙色腰带）Intro to Cybersecurity

橙色腰带：基础 pwn / 逆向 + 利用入门

## 主线目标

从"能看懂简单汇编 + ELF 结构"过渡到"能写出第一个真正的 exploit"。

## 典型内容

给你一个本地的 /challenge ELF（有时带源码，有时没有）

### 学习内容：
- 调用约定、栈帧、栈溢出
- shellcode / ret2win / ret2libc / 简单 ROP
- 用 gdb、strace、ltrace、objdump 等工具分析

### 交互形式：
- 本地直接跑 /challenge/...
- 有时用 nc 连一个远程服务，发 payload
- 不会只是"纯读汇编写答案"，而是：分析 → 构造输入 → 读到 /flag。