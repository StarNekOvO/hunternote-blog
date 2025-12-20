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
- **2x00 - Binder Deep Dive** ([02-ipc/01-binder-deep-dive.md](02-ipc/01-binder-deep-dive.md))
- **2x01 - Intent System** ([02-ipc/02-intent-system.md](02-ipc/02-intent-system.md))
- **2x02 - HIDL and AIDL (Treble)** ([02-ipc/03-hidl-aidl.md](02-ipc/03-hidl-aidl.md))
- **2x03 - Other IPC Mechanisms** ([02-ipc/04-other-ipc.md](02-ipc/04-other-ipc.md))

### Part 3: System Services (系统服务篇)
- **3x00 - system_server Architecture** ([03-services/01-system-server.md](03-services/01-system-server.md))
- **3x01 - ActivityManagerService (AMS)** ([03-services/02-ams.md](03-services/02-ams.md))
- **3x02 - PackageManagerService (PMS)** ([03-services/03-pms.md](03-services/03-pms.md))
- **3x03 - WindowManagerService (WMS)** ([03-services/04-wms.md](03-services/04-wms.md))
- **3x04 - Media Framework** ([03-services/05-media-framework.md](03-services/05-media-framework.md))

### Part 4: Native Layer Security (原生层篇)
- **4x00 - Bionic Libc** ([04-native/01-bionic-libc.md](04-native/01-bionic-libc.md))
- **4x01 - Linker and Libraries** ([04-native/02-linker.md](04-native/02-linker.md))
- **4x02 - seccomp-bpf** ([04-native/03-seccomp.md](04-native/03-seccomp.md))
- **4x03 - Android Runtime (ART)** ([04-native/04-art-runtime.md](04-native/04-art-runtime.md))
- **4x04 - Native Daemons** ([04-native/05-native-daemons.md](04-native/05-native-daemons.md))

### Part 5: Kernel Security (内核篇)
- **5x00 - Android Kernel Overview** ([05-kernel/01-kernel-overview.md](05-kernel/01-kernel-overview.md))
- **5x01 - SELinux on Android** ([05-kernel/02-selinux.md](05-kernel/02-selinux.md))
- **5x02 - Kernel Attack Surface** ([05-kernel/03-attack-surface.md](05-kernel/03-attack-surface.md))
- **5x03 - Kernel Mitigations** ([05-kernel/04-mitigations.md](05-kernel/04-mitigations.md))
- **5x04 - Android Virtualization Framework (AVF)** ([05-kernel/05-avf.md](05-kernel/05-avf.md))
- **5x05 - Kernel Exploitation Techniques** ([05-kernel/06-exploitation.md](05-kernel/06-exploitation.md))

### Part 6: Hardware Security (硬件篇)
- **6x00 - TrustZone and TEE** ([06-hardware/01-trustzone.md](06-hardware/01-trustzone.md))
- **6x01 - ARM CCA (Confidential Compute Architecture)** ([06-hardware/02-arm-cca.md](06-hardware/02-arm-cca.md))
- **6x02 - Verified Boot** ([06-hardware/03-avb.md](06-hardware/03-avb.md))
- **6x03 - Hardware-backed Keystore** ([06-hardware/04-keystore.md](06-hardware/04-keystore.md))

### Part 7: Special Topics (专题篇)
- **7x00 - WebView Security** ([07-special/01-webview.md](07-special/01-webview.md))
- **7x01 - Bluetooth Security** ([07-special/02-bluetooth.md](07-special/02-bluetooth.md))
- **7x02 - Connectivity Security (WiFi/NFC/Baseband)** ([07-special/03-connectivity.md](07-special/03-connectivity.md))

### Part 8: Practical Research (实战篇)
- **8x00 - Vulnerability Research Methodology** ([08-practical/01-methodology.md](08-practical/01-methodology.md))
- **8x01 - Debugging and Reversing** ([08-practical/02-debugging.md](08-practical/02-debugging.md))
- **8x02 - Exploit Development** ([08-practical/03-exploit-dev.md](08-practical/03-exploit-dev.md))
- **8x03 - Bug Bounty Guide** ([08-practical/04-bug-bounty.md](08-practical/04-bug-bounty.md))
- **8x04 - CVE Case Studies** ([08-practical/05-cve-studies.md](08-practical/05-cve-studies.md))

## 参考（AOSP）

- https://source.android.com/docs
- https://source.android.com/docs/core/architecture
- https://source.android.com/docs/security
- https://source.android.com/docs/security/bulletin
- https://source.android.com/docs/setup

