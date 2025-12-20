# 3x04 - Media Framework

媒体框架是 Android 中最复杂的子系统之一，也是历史上漏洞最多的地方。

对安全研究来说，这里有三个特点：

- 输入复杂（各种容器/编码/流媒体协议）
- 历史包袱重（兼容性、厂商实现、硬件加速链路）
- 进程边界多（系统不断拆分权限与沙箱）

## 1. 架构演进
- **早期**: `mediaserver` 进程拥有巨大权限，一个解析漏洞即可 Root。
- **现代**: 拆分为多个低权限进程（`mediacodec`, `mediaextractor`），并受到严格的 seccomp 限制。

可以把演进目标概括为：

- 把“解析不可信媒体数据”的逻辑放进更低权限、更强限制的进程
- 将硬件相关（codec HAL）与上层 API 解耦，减少单点崩溃/提权

## 2. 安全研究重点
- **Stagefright 漏洞**: 经典的媒体解析溢出漏洞。
- **共享内存安全**: 媒体数据在进程间传递时的越界访问。

补充常见研究面：

- **Binder 接口面**：多媒体服务通常也暴露 binder 服务（例如 codec、extractor、audio 等）
- **HAL/驱动边界**：codec2 / audio HAL / camera HAL 的参数一致性
- **文件/流输入面**：本地文件、ContentProvider URI、网络流（取决于组件）

## 3. 典型数据流（概念级）

### 3.1 播放本地媒体文件

一个常见路径是：

1. App 传入文件路径或 URI
2. Extractor 解析容器并抽取音视频流
3. Codec 解码（软件或硬件）
4. AudioTrack/Surface 输出

漏洞高发点通常在 2/3：

- 容器解析（MP4/MKV/AVI 等）
- 编码解析（H.264/HEVC/AAC 等）

### 3.2 IPC 与共享内存

为了性能，媒体数据经常通过共享内存/缓冲区在进程间传递。

研究关注：

- 长度字段与实际 buffer 大小是否一致
- “元数据”和“payload”是否会被不同组件用不同方式解释
- 句柄/FD 的权限传播（是否泄漏到不该有的进程）

## 4. 现代防护：能看到什么

- **进程拆分**：把解析面分散到多个进程
- **SELinux 域隔离**：不同媒体进程属于不同 domain
- **seccomp**：对高风险 syscall 做过滤，减少内核攻击面
- **fuzzing 与回归**：媒体组件是 fuzz 的重点区域

## 5. 研究/审计建议

### 5.1 静态审计优先级

- 解析器：边界检查、整数溢出、长度计算
- 状态机：异常路径是否回滚、释放顺序是否正确（UAF）
- 跨组件契约：A 认为 length 是字节，B 认为是 sample 数

### 5.2 动态验证

- 用最小 PoC 媒体文件触发路径（尽量缩小到单一解析器）
- 观察崩溃进程与 SELinux 域，确认是否发生越界到高权限进程

## 6. 调试与排查

- `adb logcat | grep -iE 'media|stagefright|codec|extractor'`
- 查看系统侧媒体状态：`adb shell dumpsys media.camera` / `adb shell dumpsys media.audio_flinger`（具体 dumpsys 子项取决于版本）

如果在做漏洞复现，建议记录：

- 崩溃进程名（是否在预期的低权限进程内）
- tombstone（native crash 堆栈）
- 是否触发了 seccomp/SELinux 拒绝（avc denied）

## 7. 关联阅读

- `/notes/android/04-native/03-seccomp`（媒体进程常见的 syscall 收窄手段）
- `/notes/android/05-kernel/03-attack-surface`（多媒体驱动与 ioctl 也是常见攻击面）

## 参考（AOSP）

- 媒体（Stagefright/媒体架构与组件说明）：https://source.android.com/docs/core/media
- 媒体框架强化：https://source.android.com/docs/core/media/framework-hardening
- 月度安全公告（媒体高危漏洞常在此披露与修复）：https://source.android.com/docs/security/bulletin
