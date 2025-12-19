# Android Internals for Security Researchers

Android 系统核心架构与底层运行机制分析，从 Userland 到 Kernel 边界的研究

## 目录大纲

### Part 0: Foundation
- **0x00 - Environment Setup & Technical Reference** ([00-foundation/00-environment-setup.md](00-foundation/00-environment-setup.md))
- **0x01 - Android Architecture & Security Model Overview** ([00-foundation/01-architecture-overview.md](00-foundation/01-architecture-overview.md))

### Part 1: Application Sandbox
- **1x00 - UID/GID Isolation Deep Dive** ([01-sandbox/01-uid-gid-isolation.md](01-sandbox/01-uid-gid-isolation.md))
- **1x01 - Zygote and Process Creation** ([01-sandbox/02-zygote-process.md](01-sandbox/02-zygote-process.md))
- **1x02 - Permission Model** ([01-sandbox/03-permission-model.md](01-sandbox/03-permission-model.md))
- **1x03 - Data Storage Isolation** ([01-sandbox/04-storage-isolation.md](01-sandbox/04-storage-isolation.md))
- **1x04 - App Components Security** ([01-sandbox/05-app-components.md](01-sandbox/05-app-components.md))

### Part 2: IPC Mechanisms (通信篇)
- **2x00 - Binder Deep Dive**
- **2x01 - Intent System**
- **2x02 - HIDL and AIDL (Treble)**
- **2x03 - Other IPC Mechanisms**

### Part 3: System Services (系统服务篇)
- **3x00 - system_server Architecture**
- **3x01 - ActivityManagerService (AMS)**
- **3x02 - PackageManagerService (PMS)**
- **3x03 - WindowManagerService (WMS)**
- **3x04 - Media Framework**

### Part 4: Native Layer Security (原生层篇)
- **4x00 - Bionic Libc**
- **4x01 - Linker and Libraries**
- **4x02 - seccomp-bpf**
- **4x03 - Android Runtime (ART)**
- **4x04 - Native Daemons**

### Part 5: Kernel Security (内核篇)
- **5x00 - Android Kernel Overview**
- **5x01 - SELinux on Android**
- **5x02 - Kernel Attack Surface**
- **5x03 - Kernel Mitigations**
- **5x04 - Android Virtualization Framework (AVF)**
- **5x05 - Kernel Exploitation Techniques**

### Part 6: Hardware Security (硬件篇)
- **6x00 - TrustZone and TEE**
- **6x01 - ARM CCA (Confidential Compute Architecture)**
- **6x02 - Verified Boot**
- **6x03 - Hardware-backed Keystore**

### Part 7: Special Topics (专题篇)
- **7x00 - WebView Security**
- **7x01 - Bluetooth Security**
- **7x02 - Connectivity Security (WiFi/NFC/Baseband)**

### Part 8: Practical Research (实战篇)
- **8x00 - Vulnerability Research Methodology**
- **8x01 - Debugging and Reversing**
- **8x02 - Exploit Development**
- **8x03 - Bug Bounty Guide**
- **8x04 - CVE Case Studies**

