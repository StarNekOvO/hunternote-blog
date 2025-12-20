# 5x01 - SELinux on Android

SELinux (Security-Enhanced Linux) 是 Android 强制访问控制 (MAC) 的核心。

SELinux 的目标不是“阻止一切 bug”，而是把 bug 的影响范围收窄：即使某个进程出现漏洞，进程也只能在其 domain 授权的范围内访问资源。

## 1. 运行模式
- **Permissive**: 仅记录违规行为，不拦截（通常用于开发调试）。
- **Enforcing**: 强制拦截违规行为（生产环境默认）。

研究时经常需要明确系统处于哪种模式，因为 permissive 环境下的行为与生产环境可能完全不同。

## 2. 核心概念
- **Domain (域)**: 进程的安全上下文（如 `u:r:untrusted_app:s0`）。
- **Type (类型)**: 资源的安全上下文（如 `u:object_r:app_data_file:s0`）。
- **Policy (策略)**: 定义了哪个 Domain 可以对哪个 Type 执行什么操作。

补充几个在 Android 上很常见的概念：

- **attribute**：一组 type/domain 的集合，用于批量授权
- **file context**：路径到 type 的映射（文件/目录最终是什么标签）
- **transition**：进程执行某个入口后 domain 切换（例如某服务从 init 启动后进入特定域）

## 3. 安全审计
- **Neverallow**: 策略中绝对禁止出现的规则，用于防止策略过于宽松。
- **MLS/MCS**: 通过安全级别/类别（Android 常见的是 MCS categories）来做额外隔离；具体落地依设备与厂商策略而定。

## 4. AVC Denial 排查方法

最常见的现场问题是遇到 `avc: denied`。

### 4.1 收集信息

- `adb logcat | grep -i 'avc: denied'`
- 若存在内核侧日志：`adb shell dmesg | grep -i avc`

典型日志会包含：

- `scontext`（来源 domain）
- `tcontext`（目标 type）
- `tclass`（对象类别：file/dir/socket/process 等）
- `perm`（尝试的操作：read/write/execute/connectto 等）

### 4.2 判断性质

- 若是系统组件正常功能被拦截：说明策略缺规则或上下文打标错误
- 若是低权限进程试图访问高敏感资源：可能是攻击尝试或漏洞链路

### 4.3 常见根因

- 文件/目录标签不对（file_contexts 配置或打包问题）
- 服务进程 domain 不对（init 启动配置或 transition 不生效）
- 访问路径不对（实际访问了不同的文件/设备节点）

## 5. 常用命令（设备侧）

- 查看进程上下文：`adb shell ps -AZ | head`（工具可用性依赖环境）
- 查看文件上下文：`adb shell ls -lZ <path>`
- 查看当前 enforcing：`adb shell getenforce`

## 6. 审计 checklist

1. 关键守护进程是否运行在预期 domain
2. 高风险资源（设备节点、socket、属性）是否存在异常可达路径
3. vendor 定制策略是否扩大了 privileged domain 的权限
4. neverallow 是否被绕过（构建期检测与实际镜像一致性）

## 参考（AOSP）
- https://source.android.com/docs/security/features/selinux — Android SELinux 总览：模式、域、策略与与沙盒/版本演进的关系。
- https://source.android.com/docs/security/app-sandbox — 应用沙盒的内核级隔离基础与 SELinux/seccomp 等纵深防御要点。
