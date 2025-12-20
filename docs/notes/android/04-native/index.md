# Part 4: Native Layer Security

Native 层是 Android 系统的基础，包括了 C 库、动态链接器、系统守护进程以及 Android 运行时（ART）。这里的漏洞通常是内存破坏型的，利用难度高但威力巨大。

## 1. 原生层的安全挑战

1.  **内存安全**：C/C++ 缺乏内存安全保证，溢出（Overflow）、释放后使用（UAF）是常客。
2.  **提权跳板**：许多 Native 进程以 root 或高权限 UID 运行，是实现沙箱逃逸的关键。

## 2. 专题章节

### [4x00 - Bionic Libc](./01-bionic-libc.md)
- **核心内容**: Android 特有的 C 库、堆分配器（Scudo/jemalloc）安全特性。

### [4x01 - Linker and Libraries](./02-linker.md)
- **核心内容**: `.so` 加载流程、LD_PRELOAD 劫持、符号重定向。

### [4x02 - seccomp-bpf](./03-seccomp.md)
- **核心内容**: 系统调用过滤机制、如何收窄内核攻击面。

### [4x03 - Android Runtime (ART)](./04-art-runtime.md)
- **核心内容**: DEX 编译（AOT/JIT）、类加载安全、虚拟机逃逸。

### [4x04 - Native Daemons (init/prop)](./05-native-daemons.md)
- **核心内容**: `init.rc` 审计、属性服务（Property Service）安全、`adbd` 风险。

## 参考（AOSP）

- https://source.android.com/docs/core — AOSP Core 主题总览（runtime/media/permissions/virtualization 等入口）
- https://source.android.com/docs/core/architecture — Android 系统架构与关键组件概览
- https://source.android.com/docs/core/runtime — ART/Dalvik 与运行时相关机制的总览入口
- https://source.android.com/docs/core/architecture/vndk — system/vendor 边界、可链接库集合与相关术语（涉及 linker namespace）
