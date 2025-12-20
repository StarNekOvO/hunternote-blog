# 4x02 - seccomp-bpf

Seccomp (Secure Computing) 是 Linux 内核提供的一种限制进程系统调用的机制。

在 Android 上，seccomp 的定位是“减灾”而不是“绝对安全”：即使出现 RCE，攻击者可用的 syscall 被压缩后，继续横向/提权的空间会显著变小。

## 1. Android 中的应用
- **应用进程**: 限制只能调用必要的系统调用，防止利用内核漏洞。
- **媒体服务**: 极度收窄攻击面。

常见落点包括：

- 解析不可信输入的进程（多媒体、网络相关）
- 高价值系统守护进程
- 部分 framework/native 服务进程

## 2. seccomp 的基本模型（概念级）

seccomp-bpf 通常由一组 BPF 规则构成：

- 对 syscall number（以及参数）做匹配
- 匹配结果决定：允许、拒绝、kill、返回 errno 等

因此审计时常见问题是：

- 某个危险 syscall 是否在 allowlist
- 某个“替代 syscall”是否被漏放
- 错误处理策略是否导致信息泄露或 DoS

## 3. 安全研究重点

### 3.1 策略审计

目标是回答：目标进程的 seccomp 是否启用、过滤级别是什么、规则来源在哪里。

- `/proc/<pid>/status` 中的 `Seccomp` 字段可以快速判断启用情况
- `dmesg` / `logcat` 中可能出现 seccomp 触发日志（取决于配置）

### 3.2 “绕过”在研究语境下的含义

更准确的表述是：评估当前 allowlist 是否仍然允许达成关键目标（例如读写某类资源、创建子进程、动态加载）。

在防御侧，目标是：

- 收敛 syscall 集合
- 避免把高风险 syscall 留在 allowlist
- 对必要的 syscall 采用更严格的参数约束

## 4. 调试与排查

### 4.1 快速确认 seccomp 状态

- `adb shell cat /proc/<pid>/status | grep Seccomp`

常见取值：

- `0`：未启用
- `1`：strict
- `2`：filter（Android 常见）

### 4.2 观察触发情况

当进程因 seccomp 被 kill 或返回 errno 时，通常表现为：

- 进程异常退出（可能产生日志/tombstone）
- 功能路径返回特定错误码

排查时可结合：

- `logcat` 中的 linker/系统服务日志
- tombstone 堆栈定位到触发点附近的 syscall

## 5. 与其他机制的协同

seccomp 往往与以下机制组合出现：

- SELinux（资源访问控制）
- namespace/cgroup（隔离与资源限制）
- 权限拆分与进程拆分（把高风险逻辑放入低权限进程）

综合看待能更准确判断：某个漏洞是否能从“崩溃”升级为“可控利用”。

## 参考（AOSP）

- https://source.android.com/docs/security/app-sandbox — 应用与进程隔离总体模型（与“收窄攻击面”的定位相关）
- https://source.android.com/docs/security/features/selinux — 进程/资源强制访问控制（常与 seccomp 叠加使用）
