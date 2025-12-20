# 4x04 - Native Daemons (init/prop)

原生守护进程是 Android 系统的基石，它们通常以高权限运行。

与 Java 系统服务不同，native daemons 的安全问题经常呈现为：

- “配置即安全边界”（init 配置、SELinux 域、文件权限）
- “协议解析面”（socket/Netlink/IOCTL/自定义协议）
- “属性/命令触发面”（property change、control message）

## 1. Init 进程与 init.rc
- **init.rc**: 定义了服务的启动参数、权限和 SELinux 标签。
- **审计重点**: 寻找以 root 运行且配置不当的服务。

### 1.1 init 的职责

- 解析 `*.rc` 并启动守护进程
- 管理 service 生命周期（重启策略、oneshot 等）
- 处理 property 变化触发的动作（`on property:...`）

### 1.2 init 配置的典型风险点

- service 以 root 启动且参数可被低权限影响
- 过宽的文件权限/目录权限导致替换、注入或信息泄露
- `on property` 触发链路过于敏感，属性可控则可造成越权行为

## 2. 属性服务 (Property Service)
- **机制**: `init` 进程管理的全局配置中心。
- **安全风险**: 越权修改系统属性（如 `ro.debuggable`）。

补充：

- `ro.*` 属性通常是只读（boot 阶段决定），但厂商定制可能引入可写的 debug 属性
- 安全研究里经常需要确认：某属性能否被写、由哪个域写、写入后触发了什么动作

排查思路：

- `adb shell getprop <key>` 获取属性值
- `adb shell setprop <key> <value>`（只有可写属性才会生效；受 SELinux/权限限制）
- 搜索 `init.rc` 中对该属性的触发动作（`on property:`）

## 3. adbd (Android Debug Bridge Daemon)
- **风险**: 开启 ADB 调试后的提权风险。

### 3.1 adbd 的安全语义

adbd 的风险不是“存在就危险”，而是“调试能力打开后，系统把更强的管理能力暴露给了物理连接方”。

常见关注点：

- 设备是否处于 debuggable/工程机状态
- USB 调试授权模型是否被正确执行
- 厂商定制是否引入了额外后门接口

## 4. 审计与排查手册

### 4.1 从进程与域开始

- 列出关键守护进程：`adb shell ps -A`
- 查看进程 SELinux 域（工具可用性依赖环境）：`adb shell ps -AZ | head`

### 4.2 检查启动配置与权限

- `adb shell ls -lZ /system/etc/init/`（或对应分区的 init 配置目录）
- 审计 service 条目：用户/组、capabilities、seclabel、socket、目录权限

### 4.3 检查通信面

- UDS/socket 路径权限与 context：`adb shell ls -lZ <path>`
- 配合 `/notes/android/02-ipc/04-other-ipc` 的 UDS/属性检查清单

## 5. 关联阅读

- `/notes/android/04-native/03-seccomp`
- `/notes/android/05-kernel/02-selinux`

## 参考（AOSP）

- https://source.android.com/docs/security/features/selinux — init/守护进程的域划分、策略约束与审计入口
- https://source.android.com/docs/core/architecture/partitions — system/vendor/odm 等分区职责与文件落点（定位 rc/可执行文件常用）
- https://source.android.com/docs/core/architecture/bootloader — 启动链路与 Verified Boot 关联点（影响调试能力与回滚面）
