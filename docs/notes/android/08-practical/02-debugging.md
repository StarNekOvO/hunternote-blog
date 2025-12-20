# 8x01 - Debugging and Reversing

本章聚焦“如何获得证据”：把行为链路、调用栈、输入输出、进程边界记录下来，为复现与根因定位服务。

## 1. 核心工具链
- **Frida**: 动态插桩工具，用于 Hook Java 和 Native 函数。
- **IDA Pro / Ghidra**: 静态逆向分析。
- **GDB / LLDB**: 源码级调试。
- **JADX**: Java 层反编译。

补充常用基础工具：

- `adb`：安装/启动组件/抓日志/取文件
- `logcat`：按 tag/进程过滤日志
- `dumpsys`：直接查看系统服务内部状态
- `strace`（环境允许时）：系统调用级观测

## 2. 实战技巧

### 2.1 先做“最小可观测”

- 明确入口：Intent、Binder 方法、文件/网络输入
- 明确目标进程：app 进程、system_server、media/蓝牙等专用进程
- 把日志与状态收集标准化：固定 filter 与 dumpsys 采样点

### 2.2 logcat 的使用方式

常见策略：

- 按关键 tag 过滤（如 `ActivityManager`、`WindowManager`、`PackageManager`、`art`、`linker`）
- 按崩溃关键字过滤（`FATAL EXCEPTION`、`SIGSEGV`、`Abort message`）

### 2.3 dumpsys 的定位价值

很多 system_server 问题靠 dumpsys 比靠日志更快：

- activity/task：`adb shell dumpsys activity`
- package：`adb shell dumpsys package`
- window：`adb shell dumpsys window`

### 2.4 动态插桩与调用链验证

动态插桩的目标通常是：

- 确认某输入是否进入了目标函数
- 记录参数与返回值（尤其是边界值）
- 记录调用栈与线程上下文

### 2.5 静态逆向与定位

- Java：JADX 定位入口类与关键字符串，再回到源码或 smali 看细节
- Native：Ghidra/IDA 定位导出符号、关键 ioctl/socket 协议解析函数

### 2.6 崩溃证据采集

- Java crash：exception + stacktrace
- Native crash：tombstone + 寄存器/栈回溯（可符号化则更佳）
- Kernel crash：dmesg/oops（环境允许时）

## 3. 常见问题与处理思路

### 3.1 “复现不稳定”

- 固定设备状态（网络、蓝牙、屏幕、前后台）
- 固定输入与时序（减少并发干扰）
- 记录环境差异（版本、patch level、配置开关）

### 3.2 “只看到现象，看不到原因”

- 增加观测点：日志 + dumpsys + 调用链插桩
- 把输入最小化，逐步扩大变量

## 4. 关联阅读

- `/notes/android/08-practical/01-methodology`
- `/notes/android/03-services/01-system-server`

## 参考（AOSP）
- https://source.android.com/docs/setup/contribute/report-bugs — AOSP 对“可复现步骤 + 日志/证据”的官方要求与问题跟踪流程。
- https://source.android.com/docs/security/features — 安全功能总览入口：用于对齐日志中常见的 SELinux/Verified Boot/Keystore 等概念。
