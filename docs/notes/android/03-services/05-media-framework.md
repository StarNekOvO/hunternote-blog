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

## 2. 安全研究重点与历史漏洞

媒体框架是 Android 历史上 CVE 数量最多的子系统之一。理解历史漏洞模式对研究新问题有重要参考价值。

### 2.1 Stagefright系列漏洞(2015)

**CVE-2015-1538/1539 等**：一组针对 libstagefright 的整数溢出与堆溢出漏洞。

**核心问题**：
- MP4/3GPP 容器解析中的整数溢出导致堆缓冲区分配不足
- H.264/MPEG4 编码解析的边界检查缺失
- 可通过 MMS 等方式触发（无用户交互）

**影响链路**：
- 早期：`mediaserver` 拥有 `system` 权限，可访问摄像头/麦克风/sdcard
- 利用成功后即可获得设备级权限

**修复思路**：
- 短期：修补具体整数溢出点
- 长期：拆分 mediaserver 权限，引入进程隔离

### 2.2 内存破坏类漏洞持续演进

**CVE-2017-0643 (libhevc UAF)**：HEVC(H.265) 解码器释放后使用漏洞
- 涉及解码器状态机与缓冲区生命周期管理
- 可通过恶意构造的 HEVC 流触发

**CVE-2019-2107 (媒体框架信息泄露)**：
- 编码参数泄露敏感内存内容
- 虽不能直接 RCE，但可为其他漏洞提供 ASLR bypass

**CVE-2020-0451 (媒体extractor RCE)**：
- OGG Vorbis 容器解析整数溢出
- 低权限进程，但仍可作为攻击链一环

### 2.3 共享内存与进程间边界问题

**CVE-2017-13180/13181**：媒体 codec 服务 Binder 接口参数校验不足
- 共享内存长度字段与实际映射不一致
- 导致跨进程越界访问

**常见模式**：
- **双重解释(double-fetch)**：同一共享内存被不同权限进程读取，TOCTOU 竞态
- **句柄泄露**：FD/ION handle 传递到不该触达的进程
- **元数据信任**：低权限进程提供的 size/offset 被高权限进程无条件信任

### 2.4 硬件codec与厂商实现

**CVE-2018-9411 (高通 video driver)**：
- 厂商 codec 驱动 ioctl 参数校验不足
- 涉及 DMA buffer 映射与内核内存破坏

研究重点：
- 不同 SoC(高通/联发科/三星 Exynos)的 HAL 与驱动实现差异巨大
- 很多高危漏洞集中在厂商私有 codec 实现

补充常见研究面：

- **Binder 接口面**：codec、extractor、audio、camera 服务的 AIDL/HIDL 接口
- **HAL/驱动边界**：codec2.0 / OMX / audio HAL / camera HAL 的参数一致性
- **文件/流输入面**：本地文件、ContentProvider URI、网络流、MMS、即时通讯应用的媒体处理

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

## 4. 现代防护：深度防御演进

Android 媒体框架的防护是"事后补救 → 架构重构"的典型案例。

### 4.1 进程拆分（Android 7.0+）

**拆分策略**：
- **mediaextractor**：负责容器解析（MP4/MKV/OGG 等），运行在 `mediaextractor` domain
- **mediacodec**：负责编解码（H.264/AAC 等），运行在 `mediacodec` domain
- **mediadrmserver**：DRM 相关逻辑独立进程
- **cameraserver**：摄像头相关隔离

**安全收益**：
- 单个解析器漏洞影响面降低到特定低权限进程
- 横向移动需要额外突破进程边界

### 4.2 SELinux 域隔离

每个媒体进程运行在严格约束的 domain：

```text
u:r:mediaextractor:s0
u:r:mediacodec:s0
u:r:mediadrmserver:s0
```

**典型约束**：
- 禁止访问摄像头/麦克风（仅 cameraserver 可达）
- 禁止访问网络
- 禁止读取应用私有数据（除授权路径）

可通过 `adb shell ps -AZ | grep media` 确认实际 domain。

### 4.3 Seccomp-BPF 系统调用过滤

媒体进程是 Android seccomp 策略最严格的进程之一：

**允许的syscall**：内存管理、IPC、文件基本操作
**禁止的syscall**：网络、进程创建、内核调试接口

检查方式：
- `adb shell cat /proc/<pid>/status | grep Seccomp`（显示2=严格过滤）
- 尝试被禁止的syscall会触发 `SIGSYS`

### 4.4 动态更新与 Fuzzing

**Project Mainline(Android 10+)**：
- 媒体组件以 APEX 模块形式通过 Play Store 独立更新
- 安全补丁无需等待完整 OTA

**持续 Fuzzing**：
- OSS-Fuzz / ClusterFuzz 对媒体组件持续模糊测试
- libFuzzer harness 覆盖主要解析器与 codec

## 5. 漏洞研究方法论

### 5.1 攻击面枚举

**入口类型分类**：

| 入口类型 | 触发方式 | 风险等级 | 典型例子 |
|---------|---------|---------|---------|
| 远程无交互 | MMS/RCS/IM自动下载 | 严重 | Stagefright(2015) |
| 远程需交互 | 用户打开文件/链接 | 高 | 大部分容器/codec漏洞 |
| 本地需交互 | 恶意app诱导播放 | 中-高 | ContentProvider注入 |
| 本地需权限 | 需READ_EXTERNAL_STORAGE | 中 | 私有目录访问 |

**组件优先级**：
1. **容器解析器**：MP4(libstagefright)、MKV(matroska)、OGG、AVI
2. **视频codec**：H.264/AVC、H.265/HEVC、VP8/VP9、AV1
3. **音频codec**：AAC、Vorbis、Opus、FLAC
4. **图像处理**：JPEG/PNG/GIF/WebP（libskia相关）

### 5.2 静态审计重点

**边界检查模式**：

```cpp
// 危险模式：整数溢出导致小缓冲区
uint32_t size = width * height * bpp;  // 可能溢出
buffer = malloc(size);  // 实际分配过小
memcpy(buffer, data, realSize);  // 堆溢出

// 安全模式：先检查溢出
if (__builtin_mul_overflow(width, height, &temp)) return ERROR;
if (__builtin_mul_overflow(temp, bpp, &size)) return ERROR;
```

**状态机审计**：
- 解码器初始化 → 配置 → 解码 → 释放的状态转换
- 异常路径是否正确释放资源（关注 `goto cleanup` 模式）
- 并发场景：多线程访问同一解码器状态

**共享内存契约**：
```cpp
// 进程A(低权限)准备元数据
struct MediaBuffer {
    uint32_t size;
    uint32_t offset;
    ion_handle_t handle;
};

// 进程B(高权限)使用前必须校验
if (buf->offset + buf->size > actual_ion_size) {
    // 越界检测
}
```

### 5.3 动态分析与Fuzzing

**LibFuzzer harness 示例思路**：
```cpp
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    // 创建最小 extractor 上下文
    sp<DataSource> source = new MemoryDataSource(data, size);
    MediaExtractorFactory::Create(source, nullptr);
    return 0;
}
```

**关键测试点**：
- **Corpus收集**：收集各类真实媒体文件作为种子
- **Dictionary**：为容器/编码格式添加魔数与关键字段
- **Sanitizer**：启用 ASan/UBSan/MSan 检测内存错误

**Syzkaller/Kernel fuzzing**（针对驱动）：
- 对 `/dev/video*`、`/dev/media*` 等设备节点 ioctl 进行模糊测试
- 需要构造符合驱动预期的参数结构体

### 5.4 利用链构建要点

**现代利用障碍**：
1. **进程隔离**：mediaextractor/mediacodec 权限极低
2. **ASLR**：需要信息泄露绕过
3. **SELinux**：限制横向移动与文件访问
4. **Seccomp**：syscall 白名单极小

**常见利用路径**：
- **单进程RCE** → 作为跳板通过 Binder IPC 攻击更高权限进程
- **信息泄露** → 辅助绕过 ASLR/PAC
- **结合其他漏洞** → 媒体漏洞 + kernel LPE 完整链

**Stagefright时代经典链路**（已失效）：
```text
MMS短信 → 自动下载恶意媒体 → mediaserver解析溢出
→ system权限RCE → 访问摄像头/麦克风/通讯录
```

**现代链路**（更复杂）：
```text
恶意媒体文件 → mediaextractor UAF
→ 低权限进程RCE → Binder利用攻击system_server
→ 需额外kernel漏洞才能完全控制设备
```

## 6. 调试与漏洞复现

### 6.1 环境准备

**日志收集**：
```bash
# 完整媒体相关日志
adb logcat -b main -b system -b crash | grep -iE 'media|stagefright|codec|extractor|OMX'

# 仅看错误与崩溃
adb logcat *:E | grep -i media

# Native crash tombstone
adb shell ls -lt /data/tombstones/
adb pull /data/tombstones/tombstone_XX
```

**进程监控**：
```bash
# 查看媒体进程与SELinux context
adb shell ps -AZ | grep -E 'media|codec|camera'

# 输出示例：
# u:r:mediaextractor:s0    media_ex  12345  ...
# u:r:mediacodec:s0         media_codec  12346  ...

# 监控进程重启（媒体进程崩溃会被init拉起）
adb shell logcat -b events | grep 'am_proc_start'
```

**系统服务状态**：
```bash
# 查看媒体服务状态
adb shell dumpsys media.player
adb shell dumpsys media.audio_flinger
adb shell dumpsys media.camera

# codec 信息
adb shell dumpsys media.codec
```

### 6.2 PoC构造与触发

**最小PoC原则**：
- 只保留触发漏洞的最小字节序列
- 移除无关的音视频数据
- 固定容器结构与关键字段

**触发方式**：

方式1：通过adb推送并播放
```bash
# 推送恶意文件
adb push malicious.mp4 /sdcard/Download/

# 方式A：通过am启动播放
adb shell am start -a android.intent.action.VIEW \
    -d file:///sdcard/Download/malicious.mp4 \
    -t video/mp4

# 方式B：通过MediaPlayer API（需要测试app）
```

方式2：通过Intent注入(需导出组件)
```bash
adb shell am start -n com.target.app/.VulnerableActivity \
    -d content://malicious_provider/path/to/media
```

方式3：自动化脚本
```python
import subprocess

def trigger_poc(file_path):
    subprocess.run([
        'adb', 'push', file_path, '/sdcard/poc.mp4'
    ])
    result = subprocess.run([
        'adb', 'shell', 'am', 'start',
        '-a', 'android.intent.action.VIEW',
        '-d', 'file:///sdcard/poc.mp4'
    ], capture_output=True)
    return result
```
### 6.3 崩溃分析

**tombstone解读**：
```text
*** *** *** *** *** *** *** *** *** *** *** *** *** ***
Build fingerprint: 'google/coral/coral:12/...'
pid: 12345, tid: 12350, name: MediaCodec_loop
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x41414141

Cause: null pointer dereference
    x0  0000000041414141  x1  0000007ffea0b010
    ...

backtrace:
    #00 pc 000234a8  /apex/com.android.media/lib64/libstagefright.so (parse_box+120)
    #01 pc 000235e4  /apex/com.android.media/lib64/libstagefright.so (MPEG4Extractor::parseChunk+456)
    ...
```

**关键信息**：
- `pid/tid`：确认崩溃进程（是否在 mediaextractor/mediacodec）
- `signal`：SIGSEGV(11)内存错误 / SIGABRT(6)断言失败
- `fault addr`：0x41414141 表示可能被控制的地址
- `backtrace`：定位到具体函数与偏移

**符号化堆栈**：
```bash
# 从设备拉取符号
adb pull /apex/com.android.media/lib64/libstagefright.so

# 使用addr2line定位源码行号(需要symbols)
addr2line -e libstagefright.so -f -C 0x000234a8
```

### 6.4 影响面确认

**checklist**：
1. **崩溃进程权限**：`adb shell ps -AZ <pid>` 查看SELinux context
2. **触发条件**：是否需要用户交互？是否需要特殊权限？
3. **受影响版本**：在多个Android版本/设备上验证
4. **缓解机制效果**：
   - Seccomp是否阻止后续利用：`cat /proc/<pid>/status | grep Seccomp`
   - SELinux是否限制横向移动：`adb logcat | grep 'avc: denied'`
5. **可利用性**：是否只是DoS？是否能构造有效RCE链？

## 7. 真实案例

### 7.1 重要CVE案例深入

**CVE-2015-1538 (Stagefright)** - 改变Android安全格局的标志性漏洞
- **根因**：`MPEG4Extractor::parseChunk()` 整数溢出
- **触发**：畸形3GPP文件中 `tx3g` 原子长度字段被篡改
- **影响**：Android 2.2-5.1，约95%设备
- **利用**：通过MMS无交互触发，heap spray + ROP
- **后续影响**：推动Android月度安全补丁计划

**CVE-2017-0643 (libhevc UAF)** - 新codec引入新漏洞
- **根因**：HEVC解码器上下文未正确同步导致释放后使用
- **触发**：特制 HEVC 比特流中的参数集更新
- **利用难度**：更高（已有进程隔离）
- **修复**：引入更严格的状态机检查

**CVE-2019-2107 (信息泄露)** - 看似低危但实战价值高
- **根因**：未初始化的栈/堆内存被编码进输出流
- **组合利用**：为其他RCE漏洞提供ASLR bypass
- **教训**：信息泄露在漏洞链中同样关键

**CVE-2020-0451 (OGG Vorbis RCE)** - 即使有沙箱仍可利用
- **根因**：Vorbis comment header解析整数溢出
- **进程**：mediaextractor（低权限）
- **实战价值**：可作为多阶段攻击的第一环
- **关键点**：需要结合binder利用或其他漏洞完成完整攻击链

### 7.3 厂商私有实现的典型问题

**高通codec驱动(CVE-2018-9411等)**：
- 问题：`msm_vidc` 驱动 ioctl 参数未严格校验
- 入口：`/dev/video*` 设备节点
- 危害：内核内存破坏 → LPE
- 教训：厂商私有实现审计覆盖不足

**三星Exynos codec (CVE-2019-16253)**：
- 问题：DMA buffer映射管理错误
- 特点：仅影响特定SoC设备
- 复现难度：需要对应硬件环境

### 7.4 研究价值评估

**持续高价值目标**：
- ✅ **HEVC/AV1等新codec**：代码较新，审计不充分
- ✅ **厂商私有HAL/驱动**：每家实现不同，差异化漏洞多
- ✅ **Binder接口边界**：跨进程参数校验仍是高发点
- ✅ **共享内存契约**：ION/dmabuf传递的安全问题持续存在

**价值下降领域**：
- ❌ 老旧codec（H.264/AAC）：已被大量fuzzing覆盖
- ❌ 纯DoS漏洞：除非能结合成利用链

## 参考（AOSP）

- https://source.android.com/docs/core/media — 媒体框架架构总览，理解Stagefright、MediaCodec、Extractor等组件职责分工
- https://source.android.com/docs/core/media/framework-hardening — 媒体框架安全加固：进程隔离、沙箱策略、权限拆分的官方文档
- https://source.android.com/docs/security/bulletin — 月度安全公告，媒体高危漏洞的主要披露渠道
- https://source.android.com/docs/core/ota/modular-system/media — Media Mainline模块：通过Google Play独立更新的媒体组件边界说明
- https://android.googlesource.com/platform/frameworks/av/ — frameworks/av源码：libstagefright/codec2/extractor实现
