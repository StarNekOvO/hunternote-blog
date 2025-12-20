# 7x02 - Connectivity Security (WiFi/NFC/Baseband)

连接能力的共同特点是：输入来源更不可信（无线/外部设备/运营商网络），且链路跨越多个权限域（应用、系统服务、HAL、驱动、固件），是远程攻击的重要入口。

## 1. WiFi安全

### 1.1 架构概览

```text
┌─────────────────────────────────────────────┐
│  Android Framework                          │
│  (WifiService / WifiManager)                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  wificond (Native Daemon)                   │
│  - 处理扫描、连接状态                         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  wpa_supplicant                             │
│  - WPA/WPA2/WPA3协议实现                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  nl80211 (Netlink接口)                      │
│  Linux Kernel 802.11驱动                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  WiFi固件 (Broadcom/Qualcomm等)            │
└─────────────────────────────────────────────┘
```

### 1.2 重大WiFi漏洞

**CVE-2017-13077~13088 (KRACK - Key Reinstallation Attack)**：

**影响范围**：WPA2协议本身缺陷

**原理**：
- 四次握手(4-way handshake)中可重放Message 3
- 导致nonce重用，密钥流复用
- 攻击者可解密流量或注入数据

**Android影响**：
- wpa_supplicant实现存在问题
- Android 6.0+受影响
- 通过OTA更新修复

**CVE-2019-9506 (KNOB - Key Negotiation of Bluetooth)**：

虽然主要影响Bluetooth，但WiFi Direct同样存在密钥协商问题。

**CVE-2020-3702 (Qualcomm WiFi固件堆溢出)**：

**位置**：Qualcomm WiFi芯片固件

**触发**：解析畸形管理帧(Management Frame)

**影响**：
- 攻击者发送特定WiFi帧
- 固件堆溢出
- 可能实现WiFi固件RCE

**CVE-2020-3909 (Kr00k)**：

**影响**：Broadcom/Cypress WiFi芯片

**根因**：断开连接时用全零密钥加密剩余数据

**攻击场景**：
- 攻击者强制断开目标设备
- 捕获后续使用全零密钥加密的数据包
- 解密泄露的数据

**CVE-2021-0326 (WiFi HAL堆溢出)**：

**位置**：Android WiFi HAL实现

**根因**：处理WiFi RTT(Round Trip Time)结果时缺少边界检查

```c
// 简化的漏洞代码
void handle_rtt_results(wifi_rtt_result *results, int num_results) {
    wifi_rtt_result local_buf[MAX_RESULTS];
    // ❌ 未检查num_results
    memcpy(local_buf, results, num_results * sizeof(wifi_rtt_result));
}
```

**CVE-2022-20158 (wificond OOB)**：

**位置**：wificond扫描结果处理

**根因**：解析WiFi扫描结果时的信息元素(IE)长度未验证

### 1.2.1 Canyie (残页) 相关 CVE

> GitHub: https://github.com/canyie | Blog: https://blog.canyie.top

| CVE | 类型 | 简介 | 公告 |
|-----|------|------|------|
| CVE-2025-48524 | DoS/High | WiFi 服务异常输入处理导致拒绝服务，可远程触发 WiFi 功能不可用 | [ASB 2025-06](https://source.android.com/docs/security/bulletin/2025-06-01) |

### 1.3 WiFi攻击面

**管理帧解析**：
- Beacon帧
- Probe Request/Response
- Association Request/Response
- 信息元素(Information Element)解析

**典型问题**：
```c
// 危险的IE解析模式
void parse_ie(uint8_t *ie_data, size_t ie_len) {
    uint8_t *p = ie_data;
    while (p < ie_data + ie_len) {
        uint8_t id = *p++;
        uint8_t len = *p++;  // ❌ 未检查p是否越界
        
        // ❌ 未检查len是否超出剩余数据
        process_ie(id, p, len);
        p += len;  // 可能整数溢出
    }
}
```

**安全的实现**：
```c
void parse_ie_safe(uint8_t *ie_data, size_t ie_len) {
    uint8_t *p = ie_data;
    uint8_t *end = ie_data + ie_len;
    
    while (p + 2 <= end) {  // 确保至少有id和len
        uint8_t id = *p++;
        uint8_t len = *p++;
        
        // 检查len是否合理
        if (p + len > end) {
            return;  // 长度超出边界
        }
        
        process_ie(id, p, len);
        p += len;
    }
}
```

**WiFi Direct (P2P)**：
- 设备发现协议
- GO (Group Owner) 协商
- 邻近设备通信

**风险**：
- 未授权的设备连接
- P2P消息解析漏洞

**配置存储**：
- WifiConfiguration对象
- 密码/PSK存储
- 权限检查

### 1.4 挖掘方法

**固件fuzzing**：
```bash
# 使用qca-swiss-army-knife等工具
# 生成畸形WiFi帧
python3 generate_beacon.py --overflow-ie

# 通过另一台设备发送
# 观察目标设备崩溃
```

**wpa_supplicant审计**：
```bash
# 克隆wpa_supplicant源码
git clone git://w1.fi/srv/git/hostap.git

# 关注EAP处理、WPS、P2P等复杂协议
grep -r "memcpy\|malloc\|strlen" wpa_supplicant/
```

**日志分析**：
```bash
adb logcat | grep -iE 'wifi|wpa|wificond|hostapd'
```

## 2. NFC安全

### 2.1 架构

```text
┌─────────────────────────────────────────────┐
│  应用层 (支付/门禁/交通卡)                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  NFC Service (Android Framework)            │
│  - HCE (Host Card Emulation)                │
│  - NDEF消息分发                              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  NFC HAL                                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  NFC固件 (NXP PN5xx / Broadcom等)          │
└─────────────────────────────────────────────┘
```

### 2.2 NDEF (NFC Data Exchange Format)

**结构**：
```text
NDEF消息
├─ NDEF记录1
│  ├─ 记录头(TNF, Type Length, Payload Length, ID Length)
│  ├─ Type
│  ├─ ID
│  └─ Payload
├─ NDEF记录2
└─ ...
```

**TNF (Type Name Format)**：
- Empty (0x00)
- Well-known (0x01) - RTD (Record Type Definition)
- MIME (0x02)
- URI (0x03)
- External (0x04)
- Unknown (0x05)
- Unchanged (0x06)

### 2.3 历史NFC漏洞

**CVE-2012-2900 (Android NFC UAF)**：

**位置**：NFC Service处理NDEF消息

**根因**：异步处理导致UAF

**CVE-2015-6606 (Stagefright via NFC)**：

**触发**：通过NFC传输包含Stagefright漏洞的媒体文件

**攻击链**：
```text
攻击者NFC标签 → NDEF消息(包含恶意MP4)
→ Android Beam接收
→ 自动打开MediaPlayer
→ Stagefright解析
→ RCE
```

**CVE-2016-3920 (NFC NDEF OOB)**：

**位置**：NDEF消息解析

**根因**：
```c
// 伪代码
void parse_ndef(uint8_t *data, size_t len) {
    uint8_t tnf = data[0] & 0x07;
    uint8_t type_len = data[1];
    uint32_t payload_len = read_payload_length(data);
    
    // ❌ 未验证type_len + payload_len < len
    uint8_t *type = data + HEADER_SIZE;
    uint8_t *payload = type + type_len;  // 可能越界
}
```

**CVE-2017-0647 (NFC Service信息泄露)**：

**根因**：NFC Service权限检查不当

**影响**：未授权应用可读取NFC标签内容

**CVE-2019-2114 (NFC Integer Overflow)**：

**位置**：NFC HAL

**根因**：处理NFC-DEP(Data Exchange Protocol)时整数溢出

**CVE-2021-0430 (NFC Beam OOB)**：

**位置**：Android Beam (已在Android 10移除)

**根因**：文件传输时路径处理错误

### 2.4 HCE (Host Card Emulation)

**原理**：应用可模拟NFC卡片

**安全问题**：
- 支付应用的HCE服务被劫持
- APDU (Application Protocol Data Unit)命令注入

**CVE-2018-9489 (HCE权限绕过)**：

**根因**：恶意应用可注册与支付应用相同的AID (Application Identifier)

**影响**：
- 支付数据被劫持
- POS机通信被拦截

### 2.5 挖掘方法

**NDEF fuzzing**：
```python
# 生成畸形NDEF消息
import struct

def generate_malformed_ndef():
    # 正常NDEF记录头
    tnf = 0x01  # Well-known
    flags = 0xD0  # MB=1, ME=1, SR=1
    
    type_len = 1
    payload_len = 0xFFFFFFFF  # ❌ 异常长度
    
    record = struct.pack('BBB', flags | tnf, type_len, payload_len)
    record += b'T'  # Type
    record += b'A' * 100  # Payload (实际与声明不符)
    
    return record

# 写入NFC标签
# 让Android设备读取
```

**HCE测试**：
```java
// 恶意HCE服务
public class MaliciousHCE extends HostApduService {
    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        // 拦截支付APDU命令
        logApdu(commandApdu);
        
        // 转发或篡改
        return forwardToRealPaymentApp(commandApdu);
    }
}
```

**固件分析**：
```bash
# 提取NFC固件
adb pull /vendor/firmware/
find . -name "*nfc*" -o -name "*pn5*"

# 逆向分析NFC协议栈实现
```

## 3. 基带 (Baseband) 与 RIL

### 3.1 架构

```text
┌─────────────────────────────────────────────┐
│  Android应用 (Dialer/Messaging)             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Telephony Framework                        │
│  (PhoneInterfaceManager / TelephonyManager) │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  RILJ (RIL Java层)                          │
└─────────────────┬───────────────────────────┘
                  │ Socket通信
┌─────────────────▼───────────────────────────┐
│  rild (RIL Daemon)                          │
└─────────────────┬───────────────────────────┘
                  │ 厂商RIL库
┌─────────────────▼───────────────────────────┐
│  libril-vendor.so                           │
└─────────────────┬───────────────────────────┘
                  │ AT命令或专有协议
┌─────────────────▼───────────────────────────┐
│  基带处理器 (Qualcomm/Samsung/MediaTek)     │
│  - 2G/3G/4G/5G协议栈                        │
│  - 独立OS (ThreadX/RTOS/Linux等)            │
└─────────────────────────────────────────────┘
```

### 3.2 基带固件漏洞

**CVE-2016-5340 (Qualcomm基带RCE)**：

**位置**：Qualcomm Hexagon DSP基带固件

**根因**：处理畸形LTE消息时缓冲区溢出

**触发**：伪基站发送特制LTE EMM (EPS Mobility Management)消息

**影响**：
- 基带RCE
- 可能提权到应用处理器

**CVE-2019-2232 (Shannon基带RCE)**：

**影响范围**：Samsung Exynos基带(Shannon modem)

**根因**：处理特定LTE消息时堆溢出

**触发**：伪基站发送畸形RRC (Radio Resource Control)消息

**后果**：
- 基带代码执行
- 网络流量劫持

**CVE-2020-25279 (MediaTek基带权限提升)**：

**位置**：MediaTek LTE协议栈

**根因**：AT命令处理不当

**CVE-2021-25369 (Exynos基带堆溢出)**：

**根因**：处理NR (5G New Radio) RRC消息时的内存错误

**Project Zero披露**：
- 影响多款Samsung旗舰机
- 无需用户交互的远程利用

### 3.3 RIL层漏洞

**CVE-2015-3843 (Stagefright via MMS)**：

虽然是媒体漏洞，但触发路径经过RIL：
```text
伪基站 → 发送MMS
→ 基带接收
→ RIL传递给Android
→ Messaging应用自动下载
→ Stagefright解析
→ RCE
```

**CVE-2016-5349 (RIL信息泄露)**：

**根因**：RIL权限检查不足

**影响**：未授权应用可读取IMSI/IMEI

**CVE-2017-0647 (Telephony权限绕过)**：

**根因**：TelephonyManager API权限检查缺陷

**影响**：
- 未授权发送短信
- 拨打电话

### 3.4 攻击面

**伪基站攻击**：
- 设置假冒2G/3G/4G/5G基站
- 诱导设备连接
- 发送畸形协议消息

**工具**：
- OpenBTS (2G)
- srsRAN (4G/5G)
- 商用基站设备(昂贵)

**AT命令注入**：
```bash
# 某些设备暴露AT命令接口
adb shell
su
echo "AT+COPS?" > /dev/smd0  # 查询运营商

# 危险AT命令
AT+QDOWNLOAD  # 进入下载模式
AT+QCFG       # 配置修改
```

**RIL消息fuzzing**：
```c
// Fuzzer示例(需要root)
#include <telephony/ril.h>

void fuzz_ril() {
    int ril_socket = socket_local_client("rild", 
                                        ANDROID_SOCKET_NAMESPACE_RESERVED,
                                        SOCK_STREAM);
    
    for (int i = 0; i < 100000; i++) {
        // 构造随机RIL请求
        Parcel p;
        p.writeInt32(rand() % 200);  // 随机请求ID
        p.writeInt32(rand());        // 随机token
        
        // 发送给rild
        send(ril_socket, p.data(), p.dataSize(), 0);
    }
}
```

### 3.5 基带调试

**日志收集**：
```bash
# Qualcomm QXDM日志
adb shell setprop persist.sys.modem.diag.mdlog true
adb pull /data/vendor/radio/diag_logs/

# Samsung sysdump
adb shell dumpstate

# MediaTek mtklog
adb shell am start -n com.mediatek.mtklogger/.MainActivity
```

**AT命令调试**(需root)：
```bash
# 查找AT接口
ls -l /dev/smd* /dev/tty* /dev/radio*

# 与基带交互
cat /dev/smd0 &
echo "ATI" > /dev/smd0  # 查询版本信息
```

**基带固件提取**：
```bash
# 从固件包提取
unzip firmware.zip
# 查找NON-HLOS.bin或modem.img

# 逆向分析工具
# Qualcomm: Hexagon IDA Processor
# Samsung: ARM/ARM64 (较新型号)
```

## 4. 统一防御策略

### 4.1 协议解析安全

**通用规则**：
```c
// ✅ 安全的外部消息解析模板
int parse_external_message(uint8_t *data, size_t len) {
    if (len < MIN_HEADER_SIZE) {
        return ERR_TOO_SHORT;
    }
    
    // 1. 解析头部
    struct msg_header *hdr = (struct msg_header *)data;
    
    // 2. 验证魔数/版本
    if (hdr->magic != EXPECTED_MAGIC) {
        return ERR_INVALID_MAGIC;
    }
    
    // 3. 检查长度字段合理性
    if (hdr->payload_len > MAX_PAYLOAD ||
        hdr->payload_len + sizeof(*hdr) != len) {
        return ERR_INVALID_LENGTH;
    }
    
    // 4. 校验checksum(如有)
    if (!verify_checksum(data, len)) {
        return ERR_CHECKSUM;
    }
    
    // 5. 基于验证后的长度处理
    return process_payload(hdr + 1, hdr->payload_len);
}
```

### 4.2 权限最小化

**应用层**：
- 敏感API需要动态权限(CALL_PHONE, SEND_SMS)
- 限制后台应用访问连接状态

**系统服务**：
- 严格检查Binder调用者UID/PID
- 使用SeLinux限制服务权限

**固件层**：
- 启用固件签名验证
- 隔离基带与应用处理器

### 4.3 输入验证清单

**长度字段**：
- [ ] 检查长度 ≤ 最大值
- [ ] 检查长度 + 偏移 无整数溢出
- [ ] 检查长度 + 偏移 ≤ 总数据大小

**指针操作**：
- [ ] 检查指针非NULL
- [ ] 检查指针指向有效内存区域
- [ ] 检查指针运算不越界

**循环解析**：
- [ ] 使用end指针而非长度
- [ ] 每次迭代检查剩余空间
- [ ] 防止死循环(限制迭代次数)

## 5. 研究价值排序

**持续高价值**：
- ✅ **WiFi固件** - 厂商实现差异大，攻击面广
- ✅ **基带固件** - 远程无交互RCE，影响重大
- ✅ **NFC HCE** - 支付劫持场景

**中等价值**：
- ⚠️ **wpa_supplicant** - 代码成熟，但仍有复杂协议(EAP/WPS)
- ⚠️ **RIL/Telephony** - 权限边界问题

**价值下降**：
- ❌ **Android Beam** - 已在Android 10移除
- ❌ **旧协议** - WEP/WPA已被WPA2/WPA3替代

## 参考资源

### AOSP官方
- https://source.android.com/docs/core/connect - 连接子系统总览
- https://source.android.com/docs/core/connect/wifi-overview - WiFi架构
- https://source.android.com/docs/connectivity/nfc - NFC文档
- https://source.android.com/docs/core/connect/telephony - 电话架构

### 安全研究
- Project Zero - Google团队的基带安全研究
- https://github.com/grant-h/qu1ckr00t - Qualcomm基带漏洞利用
- https://github.com/seemoo-lab/nexmon - Broadcom WiFi固件修改框架
- https://www.blackhat.com/docs/eu-17/materials/eu-17-Grassi-Exploitation-Of-A-Modern-Smartphone-Baseband.pdf
