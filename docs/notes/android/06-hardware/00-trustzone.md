# 6x00 - TrustZone and TEE

TrustZone是ARM硬件辅助的安全隔离技术，将处理器分为Normal World (REE)和Secure World (TEE)，是Android高价值资产保护的核心机制。

TEE漏洞的研究价值在于：
- **高价值目标**：密钥、生物识别数据、DRM机密
- **攻击难度大但回报高**：突破TEE意味着绕过最后防线
- **厂商差异大**：每家SoC的TEE实现完全不同

## 1. TrustZone架构

### 1.1 分层模型

```text
┌─────────────────────────────────────────────┐
│        Normal World (REE)                    │
│  ┌──────────────────────────────────────┐   │
│  │  Android Framework & Applications    │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Linux Kernel                        │   │
│  └──────────────────────────────────────┘   │
├═════════════════════════════════════════════┤ ← Secure Monitor (EL3)
│        Secure World (TEE)                    │
│  ┌──────────────────────────────────────┐   │
│  │  Trusted Applications (TAs)          │   │
│  │  - 指纹认证 TA                        │   │
│  │  - DRM TA                            │   │
│  │  - Keymaster/KeyMint TA             │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Trusted OS (Trusty/QSEE/Teegris)   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 1.2 核心组件

**Secure Monitor (EL3)**：
- 世界切换的看门人
- 响应SMC (Secure Monitor Call)指令
- 保护TEE免受REE直接访问

**Trusted OS**：
- **Trusty** (Google开源，Pixel等设备)
- **QSEE** (Qualcomm Secure Execution Environment)
- **Teegris** (三星)
- **OP-TEE** (开源实现)

**Trusted Application (TA / Trustlet)**：
- 运行在TEE内的应用逻辑
- 每个敏感功能一个独立TA

### 1.3 通信机制

**REE → TEE调用流程**：
```text
1. REE应用/服务调用Client API
2. 通过特殊驱动(/dev/trusty等)发起请求
3. 触发SMC指令进入EL3
4. Secure Monitor切换到Secure World
5. Trusted OS调度对应TA
6. TA执行并返回结果
7. 切换回Normal World
```

**共享内存**：
- REE与TEE通过共享内存传递大数据
- 需严格校验边界与权限

## 2. 历史重大TEE漏洞

### 2.1 Qualcomm QSEE漏洞

**CVE-2015-6639 (Widevine QSEE提权)**：

**根因**：QSEE Widevine TA命令处理缺陷

```c
// Widevine TA伪代码
int handle_command(uint32_t cmd_id, void *req, size_t req_len) {
    if (cmd_id == CMD_LOAD_KEY) {
        // ❌ 未校验req_len
        memcpy(key_buffer, req, req_len);  // 缓冲区溢出
    }
}
```

**影响**：
- Widevine L1密钥泄露
- TEE内存破坏
- 可能实现TEE代码执行

**CVE-2016-2431/2432 (QSEE内核提权)**：

**根因**：QSEE内核驱动与TA通信的验证不足

**攻击链**：
```text
恶意REE应用 → 构造恶意共享内存
→ QSEE驱动未充分验证
→ TEE内存破坏
→ 控制TA执行流
→ 导出密钥/绕过认证
```

**CVE-2018-11976 (QSEE Keymaster)**：

**位置**：Keymaster TA命令处理

**根因**：整数溢出导致堆溢出
```c
// 简化的漏洞代码
uint32_t num_params;  // 来自REE
size_t total_size = num_params * sizeof(param_t);  // 整数溢出

void *buffer = malloc(total_size);  // 分配过小
// 后续拷贝导致堆溢出
```

**影响**：
- 硬件支持的密钥可能被导出
- 设备认证(Attestation)可被伪造

### 2.2 Samsung Teegris漏洫

**CVE-2020-0018 (Teegris提权)**：

**根因**：Teegris内核内存管理漏洞

**影响**：
- TEE内核代码执行
- 影响Samsung Galaxy S10/S20等旗舰机
- 可绕过Knox安全

**CVE-2021-25444 (Teegris TA堆溢出)**：

**位置**：指纹识别TA

**触发**：构造畸形指纹模板数据

**影响**：
- 指纹认证绕过
- 可能泄露已注册指纹数据

### 2.3 Google Trusty漏洞

**CVE-2020-0441 (Trusty UAF)**：

**位置**：Trusty IPC消息处理

**根因**：
```c
// Trusty IPC handle释放后使用
struct ipc_port *port = get_port(port_id);
if (!port) return ERR_NOT_FOUND;

// ❌ 异步操作中port可能被释放
async_send_msg(port, msg);  // UAF
```

**影响**：
- Trusty内核内存破坏
- 可能实现TEE RCE

**CVE-2021-0921 (Gatekeeper TA)**：

**根因**：Gatekeeper TA整数溢出

**触发**：构造特殊的密码验证请求

**影响**：
- 锁屏密码验证绕过
- Pixel 3/4受影响

### 2.4 OP-TEE开源实现漏洞

**CVE-2017-1000412 (OP-TEE UAF)**：

**根因**：TA加载过程中内存管理错误

**CVE-2021-36133 (OP-TEE整数溢出)**：

**位置**：ELF loader

**影响**：加载恶意TA可导致TEE代码执行

### 2.5 厂商特有问题

**联发科TrustZone**：
- CVE-2020-0069: TEE驱动竞态条件
- CVE-2019-17390: DRM TA内存破坏

**华为可信执行环境**：
- CVE-2019-5241: iTrustee内存管理漏洞

## 3. 攻击面分析

### 3.1 REE → TEE接口

**高危命令类型**：
- 内存分配/释放相关
- 加载/卸载TA
- 密钥导入/导出
- 认证相关操作

**典型问题**：
```c
// 危险模式1: 信任REE提供的长度
void tee_handle_command(uint32_t cmd_id, 
                       void *shared_mem, 
                       size_t len) {
    // ❌ len来自不可信的REE
    char local_buf[256];
    memcpy(local_buf, shared_mem, len);  // 栈溢出
}

// 危险模式2: 未验证共享内存边界
void tee_process_buffer(struct shared_buf *buf) {
    // ❌ 未检查buf->offset + buf->size
    void *data = buf->base + buf->offset;
    process(data, buf->size);  // 可能越界
}

// 危险模式3: TOCTOU竞态
int tee_verify_and_use(struct request *req) {
    if (req->magic == MAGIC) {  // Check
        // ⏱️ REE可在此期间修改req->magic
        use_request(req);  // Use - 可能绕过检查
    }
}
```

### 3.2 TA间通信

**风险**：
- 不同TA间的IPC
- 共享资源访问
- 权限混淆

**典型场景**：
- 低权限TA调用高权限TA
- TA间共享内存管理错误

### 3.3 硬件交互

**敏感硬件访问**：
- 指纹传感器
- 安全密钥存储（efuse）
- 加密引擎
- 随机数生成器

**问题**：
- TA访问硬件时的权限检查
- 硬件返回数据的验证

## 4. 漏洞挖掘方法

### 4.1 静态分析

**获取TA二进制**：
```bash
# Trusty TA位置
adb pull /vendor/firmware/
adb pull /vendor/app/mcRegistry/  # (某些设备)

# QSEE TA位置
adb pull /firmware/image/
adb pull /vendor/firmware/

# 查找.mdt/.mbn文件(QSEE格式)
find . -name "*.mdt" -o -name "*.mbn"
```

**逆向分析**：
```bash
# 使用IDA Pro/Ghidra
# QSEE TA通常是ELF格式
file widevine.mdt

# Trusty TA是自定义格式
# 需要专用工具解析
```

**审计重点**：
- 命令处理函数(command dispatcher)
- 内存拷贝操作(memcpy/memmove/strcpy)
- 整数运算(size计算)
- 指针解引用

### 4.2 动态测试

**模糊测试策略**：

```c
// REE侧fuzzer示例
#include <trusty/tipc.h>

void fuzz_trusty_ta() {
    int fd = tipc_connect("/dev/trusty-ipc-dev0", "com.android.trusty.keymaster");
    
    for (int i = 0; i < 100000; i++) {
        struct keymaster_message msg;
        msg.cmd = rand() % 256;
        msg.payload_len = rand() % 4096;
        
        // 随机填充payload
        fill_random(msg.payload, msg.payload_len);
        
        tipc_send(fd, &msg, sizeof(msg));
        tipc_recv(fd, &response, sizeof(response));
    }
}
```

**监控崩溃**：
```bash
# Trusty崩溃日志
adb logcat | grep -i "trusty\|trust\|panic"

# QSEE崩溃日志(需要特殊方法获取)
# 通常需要JTAG或特殊固件
```

### 4.3 侧信道攻击

**缓存侧信道**：
- 利用CPU缓存行为推测TEE执行流
- Flush+Reload / Prime+Probe技术

**功耗分析**：
- 通过功耗特征推测密钥操作

**时序攻击**：
- 通过响应时间差异推测内部状态

## 5. 利用技术

### 5.1 共享内存利用

**Double Fetch漏洞**：
```c
// TEE侧代码
struct request *req = (struct request *)shared_mem;

// 第一次读取(检查)
if (req->size > MAX_SIZE) {
    return ERR_INVALID;
}

// ⏱️ REE在这里修改req->size

// 第二次读取(使用)
memcpy(local_buf, req->data, req->size);  // 越界
```

**利用方法**：
- REE侧多线程持续修改共享内存
- 竞态窗口内改变关键字段

### 5.2 堆风水(Heap Feng Shui)

**目标**：控制TEE堆布局

**步骤**：
1. 喷射大量对象占据堆空间
2. 触发漏洞释放目标对象
3. 分配可控对象占据释放空间
4. 利用UAF/OOB影响可控对象

### 5.3 ROP in TEE

**挑战**：
- TEE二进制通常启用ASLR
- 需要信息泄露
- gadget数量有限

**绕过方法**：
- 利用TA加载地址泄露
- 利用错误消息泄露地址

## 6. 防御建议

### 6.1 TA开发安全实践

**输入验证**：
```c
// ✅ 安全的命令处理
int ta_handle_command(uint32_t cmd_id,
                     struct shared_mem *smem) {
    // 1. 验证共享内存指针
    if (!is_valid_shared_mem(smem)) {
        return ERR_INVALID_PTR;
    }
    
    // 2. 验证命令ID范围
    if (cmd_id >= CMD_MAX) {
        return ERR_INVALID_CMD;
    }
    
    // 3. 验证长度字段
    if (smem->len > MAX_BUFFER_SIZE ||
        smem->offset + smem->len < smem->offset) {
        return ERR_INVALID_SIZE;
    }
    
    // 4. 拷贝到本地缓冲区(防止TOCTOU)
    char local_buf[MAX_SIZE];
    memcpy(local_buf, smem->base + smem->offset, smem->len);
    
    // 5. 基于本地副本处理
    return process_command(cmd_id, local_buf, smem->len);
}
```

**避免TOCTOU**：
- 将共享内存数据拷贝到TA本地
- 基于本地副本做所有检查和处理

**最小权限**：
- 每个TA只访问必要的硬件资源
- 限制TA间通信权限

### 6.2 平台加固

**ATF (ARM Trusted Firmware)**：
- 现代ARM设备使用ATF实现Secure Monitor
- 提供标准化的安全服务接口

**TA签名验证**：
- 仅加载经过签名的TA
- 验证TA完整性

**内存隔离**：
- 不同TA运行在隔离的内存空间
- 防止TA间互相攻击

## 7. 研究价值评估

**持续高价值**：
- ✅ **Keymaster/KeyMint TA** - 密钥管理核心
- ✅ **Gatekeeper/Weaver TA** - 认证与密码验证
- ✅ **DRM TA (Widevine)** - 内容保护
- ✅ **指纹/人脸识别TA** - 生物识别

**中等价值**：
- ⚠️ **Trusted OS内核** - 需要更深入的利用链
- ⚠️ **厂商特有TA** - 影响范围有限

**价值下降**：
- ❌ **已被移除的老旧TA** - 新设备不再使用

## 参考资源

### AOSP官方
- https://source.android.com/docs/security/features/trusty - Trusty TEE官方文档
- https://source.android.com/docs/security/features/keystore - Keymaster/KeyMint与TEE集成
- https://source.android.com/docs/security/features/authentication - 生物识别与TEE

### 开源实现
- https://github.com/OP-TEE/optee_os - OP-TEE开源实现
- https://github.com/trusty/trusty - Google Trusty(仅部分开源)

### 研究资源
- https://www.riscure.com/ - TEE安全研究论文
- Project Zero - Google安全团队的TEE漏洞分析
- https://github.com/quarkslab/samsung-trustzone-research - 三星TEE研究工具
