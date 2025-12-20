# Android Internals for Security Researchers

Android 系统核心架构与底层运行机制分析，从 Userland 到 Kernel 边界的研究

## 目录大纲

### Part 0: Foundation
- **0x00 - Environment Setup & Technical Reference** ([00-foundation/00-environment-setup.md](00-foundation/00-environment-setup.md))
- **0x01 - Android Architecture & Security Model Overview** ([00-foundation/01-architecture-overview.md](00-foundation/01-architecture-overview.md))
- **0x02 - Android Build System** ([00-foundation/02-build-system.md](00-foundation/02-build-system.md))

### Part 1: Application Sandbox
- **1x00 - UID/GID Isolation Deep Dive** ([01-sandbox/00-uid-gid-isolation](01-sandbox/00-uid-gid-isolation))
- **1x01 - Zygote and Process Creation** ([01-sandbox/01-zygote-process](01-sandbox/01-zygote-process))
- **1x02 - Permission Model** ([01-sandbox/02-permission-model](01-sandbox/02-permission-model))
- **1x03 - Data Storage Isolation** ([01-sandbox/03-storage-isolation](01-sandbox/03-storage-isolation))
- **1x04 - App Components Security** ([01-sandbox/04-app-components](01-sandbox/04-app-components))

### Part 2: IPC Mechanisms (通信篇)
- **2x00 - Binder Deep Dive** ([02-ipc/00-binder-deep-dive](02-ipc/00-binder-deep-dive))
- **2x01 - Intent System** ([02-ipc/01-intent-system](02-ipc/01-intent-system))
- **2x02 - HIDL and AIDL (Treble)** ([02-ipc/02-hidl-aidl](02-ipc/02-hidl-aidl))
- **2x03 - Other IPC Mechanisms** ([02-ipc/03-other-ipc](02-ipc/03-other-ipc))

### Part 3: System Services (系统服务篇)
- **3x00 - system_server Architecture** ([03-services/00-system-server](03-services/00-system-server))
- **3x01 - ActivityManagerService (AMS)** ([03-services/01-ams](03-services/01-ams))
- **3x02 - PackageManagerService (PMS)** ([03-services/02-pms](03-services/02-pms))
- **3x03 - WindowManagerService (WMS)** ([03-services/03-wms](03-services/03-wms))
- **3x04 - Media Framework** ([03-services/04-media-framework](03-services/04-media-framework))

### Part 4: Native Layer Security (原生层篇)
- **4x00 - Bionic Libc** ([04-native/00-bionic-libc](04-native/00-bionic-libc))
- **4x01 - Linker and Libraries** ([04-native/01-linker](04-native/01-linker))
- **4x02 - seccomp-bpf** ([04-native/02-seccomp](04-native/02-seccomp))
- **4x03 - Android Runtime (ART)** ([04-native/03-art-runtime](04-native/03-art-runtime))
- **4x04 - Native Daemons** ([04-native/04-native-daemons](04-native/04-native-daemons))

### Part 5: Kernel Security (内核篇)
- **5x00 - Android Kernel Overview** ([05-kernel/00-kernel-overview](05-kernel/00-kernel-overview))
- **5x01 - SELinux on Android** ([05-kernel/01-selinux](05-kernel/01-selinux))
- **5x02 - Kernel Attack Surface** ([05-kernel/02-attack-surface](05-kernel/02-attack-surface))
- **5x03 - Kernel Mitigations** ([05-kernel/03-mitigations](05-kernel/03-mitigations))
- **5x04 - Android Virtualization Framework (AVF)** ([05-kernel/04-avf](05-kernel/04-avf))
- **5x05 - Kernel Exploitation Techniques** ([05-kernel/05-exploitation](05-kernel/05-exploitation))

### Part 6: Hardware Security (硬件篇)
- **6x00 - TrustZone and TEE** ([06-hardware/00-trustzone](06-hardware/00-trustzone))
- **6x01 - ARM CCA (Confidential Compute Architecture)** ([06-hardware/01-arm-cca](06-hardware/01-arm-cca))
- **6x02 - Verified Boot** ([06-hardware/02-avb](06-hardware/02-avb))
- **6x03 - Hardware-backed Keystore** ([06-hardware/03-keystore](06-hardware/03-keystore))

### Part 7: Special Topics (专题篇)
- **7x00 - WebView Security** ([07-special/00-webview](07-special/00-webview))
- **7x01 - Bluetooth Security** ([07-special/01-bluetooth](07-special/01-bluetooth))
- **7x02 - Connectivity Security (WiFi/NFC/Baseband)** ([07-special/02-connectivity](07-special/02-connectivity))

### Part 8: Practical Research (实战篇)
- **8x00 - Vulnerability Research Methodology** ([08-practical/00-methodology](08-practical/00-methodology))
- **8x01 - Debugging and Reversing** ([08-practical/01-debugging](08-practical/01-debugging))
- **8x02 - Exploit Development** ([08-practical/02-exploit-dev](08-practical/02-exploit-dev))
- **8x03 - Bug Bounty Guide** ([08-practical/03-bug-bounty](08-practical/03-bug-bounty))
- **8x04 - CVE Case Studies** ([08-practical/04-cve-studies](08-practical/04-cve-studies))

## 参考（AOSP）

- https://source.android.com/docs
- https://source.android.com/docs/core/architecture
- https://source.android.com/docs/security
- https://source.android.com/docs/security/bulletin
- https://source.android.com/docs/setup

