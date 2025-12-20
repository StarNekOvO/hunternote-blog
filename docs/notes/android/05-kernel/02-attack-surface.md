# 5x02 - Kernel Attack Surface

内核漏洞是本地权限提升(LPE)的主要路径，也是完整攻击链的关键一环。

内核作为"权限最终裁决者"，一旦突破可以：
- 绕过SELinux/seccomp等所有用户态防护
- 获取root权限，完全控制设备
- 持久化恶意代码（rootkit）
- 访问所有应用数据与系统资源

## 1. 主要攻击面分类

### 1.1 系统调用 (Syscalls)

**特点**：用户态进入内核的标准接口，文档化程度高

**常见问题**：
- 参数校验不足（长度/指针/权限）
- 整数溢出导致计算错误
- TOCTOU (Time-of-Check-Time-of-Use) 竞态

**研究价值**：相对较低，因为syscall接口稳定且被大量审计

### 1.2 设备驱动 ioctl

**特点**：内核攻击面的最大来源，尤其是厂商私有驱动

**高危驱动类型**：
- **GPU驱动** (`/dev/kgsl`, `/dev/mali`等)
- **Camera驱动** (`/dev/video*`, `/dev/media*`)
- **Display驱动** (`/dev/graphics/*`)
- **Audio驱动** (`/dev/snd/*`)
- **厂商私有驱动** (高通/联发科/三星特有)

**典型问题模式**：
```c
// 危险模式1: 信任用户态长度
struct ioctl_param {
    uint32_t size;
    void *data;
};

long device_ioctl(struct file *file, unsigned int cmd, unsigned long arg) {
    struct ioctl_param param;
    copy_from_user(&param, arg, sizeof(param));
    
    // ❌ 直接使用用户提供的size
    char *buffer = kmalloc(param.size, GFP_KERNEL);
    copy_from_user(buffer, param.data, param.size);  // OOB/UAF风险
}

// 危险模式2: 未检查权限
long device_ioctl(...) {
    // ❌ 敏感操作未做capability检查
    if (cmd == DEVICE_SET_CONFIG) {
        apply_privileged_config();  // 应该检查CAP_SYS_ADMIN
    }
}
```

### 1.3 Binder驱动

**位置**：`/dev/binder`, `/dev/hwbinder`, `/dev/vndbinder`

**复杂性来源**：
- 跨进程内存管理（mmap/共享内存）
- 引用计数与生命周期
- 多线程并发
- 优先级继承与调度

**历史漏洞**：Binder是Android内核漏洞的持续来源

### 1.4 网络协议栈

**攻击向量**：
- **远程包处理**：WiFi/蓝牙/基带接收的畸形包
- **本地socket**：AF_NETLINK, AF_UNIX, AF_PACKET
- **协议实现**：TCP/UDP/ICMP/IPv6等

**特点**：可能实现远程RCE（无需物理接触）

### 1.5 文件系统

**常见问题**：
- 挂载选项解析错误
- 特定文件系统实现缺陷（ext4/f2fs/sdcardfs）
- VFS层与具体实现的边界问题

### 1.6 eBPF & 内核模块

**eBPF**：
- 强大但通常受限（verifier检查）
- 配置错误可导致任意内核代码执行

**内核模块**：
- 厂商ko文件的加载与卸载
- 模块间接口的参数校验

## 2. 历史重大漏洞分析

### 2.1 Binder漏洞系列

**CVE-2019-2215 (Bad Binder)**：

**影响**：Android 7.0-9.0，影响数亿设备

**根因**：Binder驱动UAF漏洞
```c
// 简化的漏洞代码
struct binder_thread {
    struct binder_transaction *transaction_stack;
    // ...
};

// binder_thread_release()中存在UAF
void binder_thread_release(...) {
    // 线程释放时未正确清理transaction_stack
    // 后续访问导致UAF
}
```

**触发条件**：
- 构造特殊的Binder事务序列
- 触发线程提前释放
- 利用UAF获得内核任意读写

**影响**：
- 从任意应用进程提权到root
- 绕过SELinux
- Project Zero公开披露，被广泛利用

**CVE-2020-0041 (另一个Binder UAF)**：
- 类似的Binder引用计数问题
- Android 7-10受影响
- Google 2020年2月修复

### 2.2 GPU驱动漏洞 (高通Adreno)

**CVE-2016-2504 / CVE-2016-5340系列**：

**位置**：高通Adreno GPU内核驱动(`kgsl`)

**根因**：
```c
// kgsl_ioctl_map_user_mem()函数
// ❌ 未充分校验用户态内存映射请求
int kgsl_ioctl_map_user_mem(...) {
    // 允许应用映射任意物理内存
    // 导致内核内存泄露与篡改
}
```

**影响**：
- 内核地址泄露（ASLR bypass）
- 任意内核内存读写
- 完整LPE链

**CVE-2018-11937 (Adreno UAF)**：
- GPU命令队列管理UAF
- 竞态条件触发
- 影响高通平台设备

### 2.3 Camera驱动漏洞

**CVE-2019-10567 (高通Camera)**：

**根因**：MSM camera驱动整数溢出
```c
// msm_camera ioctl处理
uint32_t num_streams;  // 用户可控
copy_from_user(&num_streams, ...);

// ❌ 整数溢出
size_t total_size = num_streams * sizeof(struct stream_info);
if (total_size > MAX_SIZE) return -EINVAL;  // 检查可被绕过

buffer = kmalloc(total_size, GFP_KERNEL);  // 分配过小
// 后续越界写
```

**CVE-2017-8236 (MSM Camera UAF)**：
- Camera驱动release路径竞态
- 多线程并发触发UAF

### 2.4 Dirty COW类通用漏洞

**CVE-2016-5195 (Dirty COW)**：

**根因**：Linux内核copy-on-write竞态条件

**在Android上的利用**：
- 篡改只读文件（如系统二进制）
- 注入代码到system进程
- 持久化root权限

**影响**：Android 4.0-7.1.2全版本

**修复**：内核补丁 + 应用沙箱加固

**CVE-2022-0847 (Dirty Pipe)**：
- Dirty COW的现代变种
- Linux 5.8-5.16内核
- 影响新版Android设备
- 可覆盖只读文件内容

### 2.5 特定SoC漏洞

**高通相关**：
- CVE-2020-11179: WLAN驱动OOB写
- CVE-2021-1905: GPU内存管理UAF  
- CVE-2023-21647: Display驱动整数溢出

**联发科相关**：
- CVE-2020-0069: GPU驱动UAF
- CVE-2021-0661: Camera驱动竞态

**三星Exynos**：
- CVE-2021-25337: Mali GPU驱动UAF

## 3. 攻击面枚举实战

### 3.1 设备节点分析

**枚举可访问设备**：
```bash
# 查看所有设备节点
adb shell ls -lZ /dev/ | head -n 50

# 筛选untrusted_app可访问的设备
adb shell ls -lZ /dev/ | grep -E 'untrusted_app|u:object_r:device:s0'

# 常见高危设备节点
adb shell ls -lZ /dev/kgsl*      # GPU
adb shell ls -lZ /dev/video*     # Camera
adb shell ls -lZ /dev/graphics/* # Display
adb shell ls -lZ /dev/snd/*      # Audio
adb shell ls -lZ /dev/binder*    # Binder
```

**分析示例**：
```text
crw-rw---- 1 system graphics u:object_r:gpu_device:s0 /dev/kgsl-3d0
crw-rw---- 1 root camera u:object_r:video_device:s0 /dev/video0

# 检查SELinux策略
adb shell sesearch --allow -s untrusted_app -t gpu_device -c chr_file
# 如果有ioctl权限,则该设备可能是攻击面
```

### 3.2 ioctl命令枚举

**方法1：从驱动源码提取**
```bash
# AOSP/厂商内核源码
grep -r "_IOR\|_IOW\|_IOWR" drivers/staging/android/

# 高通CAF源码
grep -r "VIDIOC_\|MSM_CAM_" drivers/media/platform/msm/
```

**方法2：从设备逆向**
```bash
# 拉取驱动ko文件
adb pull /vendor/lib/modules/camera.ko

# 使用IDA/Ghidra分析ioctl handler
# 查找unlocked_ioctl函数指针
```

**方法3：动态跟踪**
```bash
# strace应用系统调用
adb shell strace -e ioctl -p <pid>

# 或使用eBPF跟踪ioctl
```

### 3.3 模糊测试策略

**Syzkaller (内核fuzzer)**：
```bash
# 为Android设备配置syzkaller
# 需要root设备 + 自定义内核
git clone https://github.com/google/syzkaller

# 编写设备特定syscall描述
# devices/android_specific.txt
```

**手动ioctl fuzzing**：
```c
#include <fcntl.h>
#include <sys/ioctl.h>

void fuzz_device_ioctl(const char *device) {
    int fd = open(device, O_RDWR);
    if (fd < 0) return;
    
    for (uint32_t cmd = 0; cmd < 0x10000; cmd++) {
        char buf[4096];
        memset(buf, 0x41, sizeof(buf));
        
        // 尝试所有可能的ioctl命令
        ioctl(fd, cmd, buf);
    }
    close(fd);
}
```

## 4. 漏洞利用要点

### 4.1 现代缓解机制

**KASLR (内核地址随机化)**：
- 需要信息泄露绕过
- 可能的泄露源：`/proc`、`/sys`、驱动调试信息

**PAN/PXN (特权访问保护)**：
- 禁止内核直接访问用户态内存/代码
- 需要纯内核空间ROP

**CFI (控制流完整性)**：
- 限制间接跳转目标
- kCFI (Clang实现)

**Stack Canary & SCS**：
- 保护栈完整性
- Shadow Call Stack保护返回地址

### 4.2 典型利用步骤

```text
1. 信息泄露 → 破解KASLR
   ├─ /proc/kallsyms泄露(需权限)
   ├─ 驱动UAF泄露内核地址
   └─ Spectre类侧信道

2. 内存破坏 → 获得读写原语
   ├─ UAF: 控制已释放对象
   ├─ OOB: 越界读写相邻对象
   └─ Double Free: 堆管理器破坏

3. 提权 → 修改cred结构
   ├─ commit_creds(prepare_kernel_cred(0))
   └─ 直接修改当前进程cred为root

4. SELinux绕过
   ├─ 修改selinux_enforcing为0 (permissive)
   └─ 修改当前进程的SELinux context

5. 持久化 (可选)
   ├─ 修改init脚本
   ├─ 注入内核模块
   └─ Hook系统调用表
```

### 4.3 利用难度评估

**容易**：
- 明确的任意读写原语
- KASLR已被绕过
- 目标设备缓解机制较弱

**中等**：
- 需要构造复杂的堆布局
- 需要信息泄露+内存破坏组合
- 存在部分缓解机制

**困难**：
- 仅有条件竞态触发
- 强缓解机制（CFI+PAN+SCS+MTE）
- 需要多个漏洞链接

## 5. 防御与检测

### 5.1 开发阶段

**静态分析**：
- Clang Static Analyzer
- Coverity / CodeQL
- 内核特定检查器(Sparse/Smatch)

**代码审计重点**：
```c
// ✅ 安全的ioctl实现示例
static long device_ioctl(struct file *file, 
                        unsigned int cmd, 
                        unsigned long arg) {
    struct ioctl_param param;
    int ret;
    
    // 1. 权限检查
    if (!capable(CAP_SYS_ADMIN))
        return -EPERM;
    
    // 2. 命令号验证
    if (_IOC_TYPE(cmd) != DEVICE_MAGIC)
        return -ENOTTY;
    
    // 3. 大小检查
    if (_IOC_SIZE(cmd) != sizeof(param))
        return -EINVAL;
    
    // 4. 安全的copy_from_user
    if (copy_from_user(&param, (void __user *)arg, sizeof(param)))
        return -EFAULT;
    
    // 5. 参数范围检查
    if (param.size > MAX_SIZE || param.offset > MAX_OFFSET)
        return -EINVAL;
    
    // 6. 防止整数溢出
    if (param.offset + param.size < param.offset)
        return -EINVAL;
    
    // ... 处理请求
    return 0;
}
```

### 5.2 运行时检测

**KASan (Kernel Address Sanitizer)**：
- 检测内存错误（UAF/OOB）
- 性能开销大，主要用于开发测试

**KFENCE (Kernel Electric Fence)**：
- 轻量级内存错误检测
- 可在生产环境使用

**Kernel Lockdep**：
- 检测锁顺序错误
- 预防死锁与竞态

## 参考资源

### AOSP官方
- https://source.android.com/docs/core/architecture/kernel - Android内核架构与GKI
- https://source.android.com/docs/security/overview/kernel-security - 内核安全机制总览
- https://source.android.com/docs/security/bulletin - 月度安全公告(内核CVE主要披露渠道)

### 内核源码
- https://android.googlesource.com/kernel/common/ - Android通用内核(ACK)
- https://source.codeaurora.org/ - 高通CAF内核(已归档)

### 研究资源
- Project Zero blog - Google安全团队的内核漏洞分析
- https://github.com/google/syzkaller - 内核fuzzing框架
- https://github.com/torvalds/linux - 上游Linux内核
