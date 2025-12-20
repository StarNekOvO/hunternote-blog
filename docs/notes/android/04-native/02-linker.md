# 4x01 - Linker and Libraries

动态链接器（`/system/bin/linker`）负责在程序启动时加载共享库（`.so`）。

在 Android 上，linker 还承担了“库访问隔离”的安全职能：不同分区（system/vendor/product）与不同进程类型能加载的库集合被强约束，这直接影响：

- 注入/劫持类技术是否可行
- 目标 `.so` 的可达性与可替换性
- 链接错误带来的崩溃与信息泄露边界

## 1. 加载流程
1. 解析 ELF 头部。
2. 加载依赖库。
3. 执行重定位（Relocation）。
4. 执行初始化函数（`.init_array`）。

更细一点的关键节点（概念级）：

- 解析 `PT_INTERP` 确定解释器（linker 自身）
- 解析 `DT_NEEDED` 递归加载依赖
- 处理符号解析与重定位（`REL/RELA`）
- 处理 TLS、构造函数（`.init/.init_array`）

研究时常见的“真实问题”是：某个符号到底从哪一个 so 解析出来、解析顺序是否可控、以及是否被命名空间策略拦住。

## 2. 安全研究重点

### 2.1 `LD_PRELOAD` 与注入的边界

`LD_PRELOAD` 在传统 Linux 上常用于函数劫持，但在 Android 上受到多层限制：

- 进程启动方式、zygote 孵化与环境变量继承
- setuid/受限进程对环境变量的忽略
- linker namespace 对库路径的限制

因此在非 root 场景下，`LD_PRELOAD` 更多出现在：调试环境、工程机、或特定可控的启动链路。

### 2.2 符号解析与重定位的攻击面

- **GOT/PLT 劫持**：通常需要先有任意写或相邻内存破坏
- **符号冲突**：同名符号在不同 so 间的解析结果可能导致逻辑偏转
- **构造函数执行**：`.init_array` 在加载时执行，属于“早期执行点”

### 2.3 命名空间隔离（Android 7.0+）

linker namespace 的目标是：限制进程能看到/能链接的 so 集合。

关注点包括：

- public libraries 列表（哪些库可被应用直接链接）
- vendor/system 分区边界（VNDK 等）
- 目标进程所属的 namespace 与搜索路径

## 3. 常见问题类型（偏排查）

### 3.1 `dlopen` 失败

典型原因：

- so 不在可见 namespace
- 依赖链缺库（某个 `DT_NEEDED` 找不到）
- ABI/ELF 不匹配

### 3.2 运行时崩溃发生在重定位/构造阶段

- 重定位表损坏（内存破坏或文件损坏）
- 构造函数里访问了尚未初始化的全局状态

## 4. 调试与定位

### 4.1 静态检查（离线）

- `readelf -d <so>` 查看 `DT_NEEDED`
- `readelf -r <so>` 查看重定位
- `nm -D <so>` / `readelf -Ws <so>` 看导出符号

### 4.2 设备侧快速定位

- 查看进程映射：`adb shell cat /proc/<pid>/maps | grep '\.so'`
- 查看动态链接错误日志：`adb logcat | grep -iE 'linker|dlopen|CANNOT LINK EXECUTABLE'`

## 5. 关联阅读

- `/notes/android/04-native/01-bionic-libc`
- `/notes/android/04-native/03-seccomp`（进程能力收窄与 syscall 约束）

## 参考（AOSP）

- https://source.android.com/docs/core/architecture — Android 系统架构总览（理解进程/分区/组件边界）
- https://source.android.com/docs/core/architecture/vndk — VNDK/LL-NDK 与 system/vendor 的 ABI/库边界
- https://source.android.com/docs/core/architecture/vndk/linker-namespace — linker namespace 机制（库可见性/搜索路径/隔离策略）
