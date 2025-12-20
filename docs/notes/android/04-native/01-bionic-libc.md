# 4x00 - Bionic Libc

Bionic 是 Google 为 Android 开发的 C 标准库，旨在替代 GNU C Library (glibc)。

在 Android 系统里，Bionic 不只是 libc 实现，还承载了：

- 动态链接器协作（bionic 与 linker 的边界）
- 系统属性访问、日志、线程/信号等基础设施
- 若干安全加固（FORTIFY、堆分配器演进）

## 1. 与 glibc 的差异（研究价值）

理解差异的意义在于：同一类漏洞在不同 libc/allocator 上可利用性差异巨大。

- Bionic 更偏向移动端约束（体积、启动性能、平台特性）
- 部分接口/行为与 glibc 不完全一致（源码审计与复现时需以 AOSP 为准）

## 2. 安全特性

### 2.1 FORTIFY（编译期 + 运行期边界检查）

常见表现是：部分 libc API 在启用 FORTIFY 时会变成带有长度参数的检查版本。

- 价值：降低“显而易见的越界写”成功率
- 边界：若长度/对象大小信息不可得，检查能力会下降；逻辑错误与整数溢出仍可能绕过

### 2.2 堆分配器演进（Scudo / jemalloc 等）

现代 Android 大量场景使用 **Scudo**（具体取决于版本与进程类型）。其典型防护目标包括：

- 缓冲区溢出检测（guard/校验）
- UAF 风险降低（隔离/延迟复用）
- 堆元数据防篡改

需要注意：不同进程/不同版本可能使用不同 allocator 策略，定位时应以实际二进制与系统版本为准。

## 3. 安全研究重点

### 3.1 典型漏洞类型

- **整数溢出/截断**：长度计算错误导致分配不足或拷贝过界
- **边界检查缺失**：`memcpy/strcpy/sprintf` 等路径上的参数校验不足（含 JNI/系统服务调用到 native 的边界）
- **UAF/Double free**：对象生命周期管理错误（常见于复杂解析器/协议栈，而不是 libc 本身）

### 3.2 allocator 相关的“可利用性问题”

研究时常见工作不是“找漏洞”，而是判断：

- 同类 bug 在 Scudo 下是否可稳定控制
- 崩溃点是否在硬化检查处（例如检测到 heap corruption 直接 abort）

## 4. 调试与定位

### 4.1 崩溃观测

- `adb logcat` 观察 abort 信息
- native tombstone 堆栈用于确认崩溃在 libc/allocator 的哪个检查点

### 4.2 版本与实现定位

定位时通常需要回答：

- 目标进程是否链接 bionic（基本是）
- allocator 实现是否为 Scudo/jemalloc/其他
- 是否启用额外硬化（例如针对特定进程的编译选项）

## 5. 审计 checklist（偏实战）

1. 所有长度字段是否做上界限制（尤其是来自不可信输入的长度）
2. 所有乘法/加法是否考虑溢出（分配大小计算）
3. copy/format 类 API 是否存在“目标缓冲区大小未知”的使用方式
4. 对象释放后是否仍被回调/异步路径引用（UAF 高发）

## 参考（AOSP）

- https://source.android.com/docs/core/architecture — 从 AOSP 官方的“软件栈分层”视角定位 native 库（含 libc/linker 所在层级）在系统中的位置
- https://source.android.com/docs/core/architecture/vndk — 从 Treble 的 system/vendor 边界理解 `libc.so`/`libdl.so` 等作为 LL-NDK 的稳定性承诺，以及动态链接/依赖隔离（linker namespace）相关概念
