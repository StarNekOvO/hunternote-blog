# 7x01 - Bluetooth Security

Android 的蓝牙协议栈是近年远程RCE漏洞的重灾区。

蓝牙的安全研究价值在于：
- **无需用户交互**：通过无线近场即可触发
- **协议复杂度高**：多层协议栈(HCI/L2CAP/SDP/RFCOMM/GATT...)
- **实现差异大**：芯片厂商(Broadcom/Qualcomm)与系统层实现各异
- **攻击面广**：从固件到framework多层可攻击

## 1. 架构与协议栈

### 1.1 分层结构

```text
┌─────────────────────────────────────┐
│   Java Framework (Settings/BT App)  │  ← 应用层API
├─────────────────────────────────────┤
│   com.android.bluetooth Process     │  ← Java服务(GATT/A2DP/HFP)
├─────────────────────────────────────┤
│   Bluetooth Stack (Fluoride/Gabeldorsche) │ ← C++协议栈
│   - L2CAP, SDP, RFCOMM, GATT        │
├─────────────────────────────────────┤
│   HCI (Host Controller Interface)   │  ← 与芯片通信接口
├─────────────────────────────────────┤
│   Bluetooth Controller (Firmware)   │  ← 芯片固件
└─────────────────────────────────────┘
```

### 1.2 关键组件

**Fluoride vs Gabeldorsche**:
- **Fluoride**：Android传统蓝牙栈(至Android 12)
- **Gabeldorsche**：重构版蓝牙栈(Android 13+)，引入gRPC与Rust组件

**核心协议**:
- **L2CAP**：逻辑链路控制与适配协议，提供分片重组
- **SDP**：服务发现协议
- **RFCOMM**：串口仿真协议（蓝牙串口profile基础）
- **GATT**：BLE通用属性协议（蓝牙低功耗核心）
- **SMP**：安全管理协议（配对/加密）

## 2. 历史重大漏洞分析

### 2.1 BlueBorne系列(2017) - CVE-2017-0781/0782/0785

**影响范围**：Android 3.0-8.0，数十亿设备

**核心漏洞**：

**CVE-2017-0781 (信息泄露)**:
- **位置**：`btif/src/btif_pan.c` 中 PAN profile处理
- **根因**：栈地址泄露，为ASLR bypass铺路
- **触发**：无需配对，通过BNEP协议包触发

**CVE-2017-0782 (RCE - 最critical)**:
- **位置**：`stack/l2cap/l2c_main.c` L2CAP分片重组
- **根因**：
  ```cpp
  // 伪代码示意
  if (total_length > L2CAP_MTU) {
      buffer = malloc(total_length);  // 用户可控
  }
  // 后续写入未检查每个分片长度
  memcpy(buffer + offset, fragment_data, fragment_len);
  ```
- **利用**：heap overflow → ROP chain
- **无交互**：仅需蓝牙打开

**CVE-2017-0785 (中间人攻击)**:
- **位置**：BNEP配置协商
- **根因**：身份验证绕过
- **场景**：PAN连接过程

**攻击链**：
```text
1. 扫描发现目标设备(蓝牙MAC)
2. 通过CVE-2017-0781泄露栈地址 → 破解ASLR
3. 通过CVE-2017-0782发送畸形L2CAP包 → 堆溢出
4. ROP/shellcode执行 → 获得com.android.bluetooth进程权限
5. 进一步提权或横向移动
```

### 2.2 BlueFrag(2020) - CVE-2020-0022

**影响**：Android 8.0-9.0

**根因**：L2CAP reassembly逻辑错误
```cpp
// simplified vulnerable code
void reassemble_fragments() {
    uint16_t total_len = first_fragment->length;
    buffer = malloc(total_len);
    
    for (frag in fragments) {
        memcpy(buffer + offset, frag->data, frag->len);  
        offset += frag->len;  // ❌ 未检查offset < total_len
    }
}
```

**触发条件**：
- 目标蓝牙已打开
- 无需配对
- 发送精心构造的L2CAP分片序列

**实战价值**：
- 零点击RCE（无用户交互）
- 可蠕虫化传播

### 2.3 BrakTooth系列(2021) - 芯片层漏洞

**特点**：影响蓝牙芯片固件而非Android系统

**典型漏洞**：
- **LMP协议解析错误**：link management protocol处理缺陷
- **固件崩溃/DoS**：大部分为拒绝服务，少数可RCE
- **影响范围**：Broadcom/Qualcomm/Intel等主流芯片

**攻击路径**：
```text
HCI命令 → 芯片固件 → LMP消息解析 → 固件崩溃/代码执行
```

**防御难度**：需要芯片厂商固件更新，Android系统层无法直接修复

### 2.4 近期持续漏洞

**CVE-2022-20216 (GATT UAF)**:
- BLE GATT服务器释放后使用
- 影响Android 10-12
- 需要已配对设备触发

**CVE-2023-20938 (L2CAP整数溢出)**:
- 又一次L2CAP解析问题
- 证明此类攻击面仍未完全收敛

## 3. 攻击面深度剖析

### 3.1 经典蓝牙攻击面

**L2CAP - 最高危**：
- **分片重组**：历史上多次出现堆溢出（BlueBorne/BlueFrag）
- **配置协商**：参数验证不足导致整数溢出
- **状态机**：连接/断开竞态条件

**RFCOMM**：
- 信用流控制逻辑错误
- 串口数据解析（AT命令注入等应用层问题）

**SDP (服务发现)**：
- 响应包解析（长度字段/嵌套TLV）
- 服务记录注入

### 3.2 BLE (蓝牙低功耗) 攻击面

**GATT**：
- 特征值读写时的内存管理
- 通知/指示的序列化/反序列化
- 服务发现响应解析

**SMP (安全配对)**：
- 配对过程的密码学实现错误
- Just Works模式的中间人风险
- 密钥协商的整数溢出

### 3.3 进程与权限边界

**com.android.bluetooth进程**：
```bash
u:r:bluetooth:s0    bluetooth  12345  1  ...
```

**关键特征**：
- UID: `bluetooth (1002)`
- SELinux域: `bluetooth`
- 权限：可访问蓝牙硬件、配置、部分系统服务
- 限制：不能访问应用私有数据、不能直接访问网络

**横向移动路径**：
- 攻击bluetooth进程 → 通过Binder利用system_server
- 需要结合其他漏洞才能达成完整设备控制

## 4. 漏洞挖掘方法

### 4.1 静态分析重点

**协议解析关键模式**：
```cpp
// 危险模式1: 信任外部长度字段
uint16_t pkt_len = *(uint16_t*)data;  // 来自无线包
buffer = malloc(pkt_len);              // 未检查上界
memcpy(buffer, data+2, pkt_len);     // 堆溢出

// 危险模式2: 分片重组
total_len = first_fragment->total;
buffer = malloc(total_len);
for each fragment:
    offset += fragment->len;           // ❌ 未检查累计长度
    memcpy(buffer+offset, fragment->data, fragment->len);

// 危险模式3: 状态机竞态
if (connection->state == CONNECTED) {
    // ❌ 检查与使用之间可能被异步修改
    process_data(connection);
}
```

**审计Checklist**：
- [ ] 所有来自HCI的长度字段是否有上界检查
- [ ] 分片重组是否防止超界累加
- [ ] 并发场景的连接对象生命周期管理
- [ ] 配对状态与权限检查的一致性

### 4.2 Fuzzing策略

**HCI Fuzzing**：
```python
# 使用btlejack/scapy等工具构造畸形HCI包
from scapy.all import *

# 构造畸形L2CAP包
l2cap_pkt = L2CAP_Hdr(len=0xFFFF) / Raw(b"A"*1000)
send_hci_packet(l2cap_pkt)
```

**工具链**：
- **btlejack**：BLE嗅探与注入
- **ubertooth**：经典蓝牙嗅探
- **InternalBlue**：Broadcom芯片调试框架
- **BLEah**：自动化BLE fuzzing

**关键测试点**：
- L2CAP MTU边界值
- 分片序列异常顺序(乱序/重复/缺失)
- SDP服务记录嵌套深度
- GATT特征值超长数据

### 4.3 动态调试

**日志收集**：
```bash
# 开启蓝牙详细日志
adb shell setprop log.tag.bluetooth VERBOSE
adb shell setprop log.tag.bt_btif VERBOSE

# 实时监控
adb logcat -b main | grep -iE 'bluetooth|l2cap|gatt|btif'

# HCI snoop log(需要开发者选项)
adb shell setprop persist.bluetooth.btsnooplogmode full
# 日志位置: /data/misc/bluetooth/logs/btsnoop_hci.log
adb pull /data/misc/bluetooth/logs/btsnoop_hci.log
```

**使用Wireshark分析HCI日志**：
```bash
wireshark btsnoop_hci.log
# 过滤器: bthci || btl2cap || btatt
```

## 5. 漏洞复现与利用

### 5.1 环境准备

**硬件需求**：
- **攻击端**：Linux机器 + 蓝牙USB适配器 / Ubertooth One / BLE dongle
- **目标端**：待测试的Android设备

**软件工具**：
```bash
# 安装BlueZ协议栈工具
apt-get install bluez libbluetooth-dev

# 安装分析工具
apt-get install wireshark

# Python蓝牙库
pip install pybluez PyBluez-wheels scapy
```

### 5.2 PoC开发流程

**BlueFrag(CVE-2020-0022)复现示例思路**：

```python
#!/usr/bin/env python3
# 仅供教育目的,请勿用于未授权测试
import socket
from struct import pack

def send_malicious_l2cap(target_mac):
    # 建立L2CAP连接
    sock = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_RAW, socket.BTPROTO_L2CAP)
    sock.connect((target_mac, 1))  # PSM=1
    
    # 构造畸形分片序列
    # 第一个分片声称总长度很小
    frag1 = pack('<HH', 0x100, 0x00) + b'A' * 0x100
    
    # 后续分片累计超出总长度
    frag2 = b'B' * 0x1000
    frag3 = b'C' * 0x1000
    
    sock.send(frag1)
    sock.send(frag2)
    sock.send(frag3)
    
    sock.close()

# 使用时需修改为目标设备MAC
# send_malicious_l2cap("XX:XX:XX:XX:XX:XX")
```

### 5.3 漏洞利用难点

**现代缓解机制**：
1. **ASLR**：需要信息泄露漏洞
2. **DEP/NX**：需要ROP/JOP
3. **SELinux**：bluetooth域权限有限
4. **进程隔离**：com.android.bluetooth权限不足以完全控制设备

**实战利用链**：
```text
[信息泄露] → 破解ASLR
    ↓
[堆溢出/UAF] → 控制EIP/RIP
    ↓
[ROP chain] → 绕过DEP执行shellcode
    ↓
[Binder exploit] → 横向攻击system_server
    ↓
[Kernel LPE] → 获取root权限
```

## 6. 防御与加固

### 6.1 系统层防护

**进程隔离**：
- com.android.bluetooth运行在独立进程
- UID=1002 (bluetooth)
- SELinux domain=bluetooth

**权限限制**：
```text
# bluetooth域典型SELinux策略(简化版)
allow bluetooth bluetooth_prop:file read;
allow bluetooth hci_device:chr_file rw;
neverallow bluetooth app_data_file:file *;  # 禁止访问应用数据
```

**Seccomp过滤**：
- 限制bluetooth进程可用syscall
- 禁止execve/ptrace等危险调用

### 6.2 开发建议

**协议解析安全编码**：
```cpp
// ✅ 安全模式
bool parse_l2cap_fragment(const uint8_t* data, size_t len) {
    if (len < L2CAP_HDR_SIZE) return false;
    
    uint16_t pkt_len = *(uint16_t*)data;
    
    // 严格上界检查
    if (pkt_len > L2CAP_MAX_MTU) {
        LOG_ERROR("Packet too large: %u", pkt_len);
        return false;
    }
    
    // 检查实际数据长度
    if (len < L2CAP_HDR_SIZE + pkt_len) {
        return false;
    }
    
    // 安全分配
    uint8_t* buffer = (uint8_t*)calloc(1, pkt_len);
    if (!buffer) return false;
    
    memcpy(buffer, data + L2CAP_HDR_SIZE, pkt_len);
    
    // ... process buffer ...
    free(buffer);
    return true;
}
```

**状态机安全模式**：
```cpp
class Connection {
    std::mutex state_mutex;
    ConnectionState state;
    
    void process_data(const uint8_t* data, size_t len) {
        std::lock_guard<std::mutex> lock(state_mutex);
        
        // TOCTOU安全：在锁内检查和使用状态
        if (state != CONNECTED) {
            return;
        }
        // ... 处理数据 ...
    }
};
```

### 6.3 用户防护

**最佳实践**：
- 不使用时关闭蓝牙
- 避免在公共场所开启"可发现"模式
- 及时安装安全更新
- 警惕未知设备的配对请求

## 参考（AOSP）

- https://source.android.com/docs/core/connect - Android连接子系统总览（蓝牙/WiFi/NFC等）
- https://source.android.com/docs/core/ota/modular-system/bluetooth - 蓝牙Mainline模块：APEX形式独立更新机制
- https://source.android.com/docs/security/bulletin - 安全公告：蓝牙CVE披露与补丁时间线
- https://android.googlesource.com/platform/packages/modules/Bluetooth/ - 蓝牙协议栈源码(Fluoride/Gabeldorsche)
- https://www.bluetooth.com/specifications/specs/ - 蓝牙SIG官方协议规范
