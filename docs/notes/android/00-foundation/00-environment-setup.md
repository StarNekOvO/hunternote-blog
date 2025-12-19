# 0x00 - Environment Setup & Technical Reference

## 1. AOSP 编译环境

本地 AOSP 源码是深入研究 Android 底层的基石。以下为编译 Android 14/15 的推荐配置与步骤。

### 硬件要求
- **内存**：至少 32GB (推荐 64GB+)。
- **硬盘**：至少 500GB 剩余空间 (推荐 NVMe SSD)。
- **系统**：Ubuntu 20.04/22.04 LTS。

### 基础依赖安装
```bash
sudo apt-get install git-core gnupg flex bison build-essential zip curl zlib1g-dev gcc-multilib g++-multilib libc6-dev-i386 libncurses5 lib32ncurses5-dev x11proto-core-dev libx11-dev lib32z1-dev libgl1-mesa-dev libxml2-utils xsltproc unzip fontconfig
```

### 源码同步
```bash
repo init -u https://android.googlesource.com/platform/manifest -b android-14.0.0_r1
repo sync -j$(nproc)
```

---

## 2. 调试与分析工具

### 调试器 (Debugger)
- **GDB / LLDB**：用于 Native 层调试。建议使用 AOSP 路径下的预编译版本：
  - `prebuilts/gdb/`
  - `prebuilts/clang/host/linux-x86/bin/lldb`
- **Frida**：动态 Hook 与追踪工具。
  ```bash
  pip install frida-tools
  ```

### 运行环境选择
- **模拟器 (Cuttlefish)**：Google 官方推荐的虚拟化研究环境，支持内核调试与元数据追踪。
- **真机 (Pixel)**：建议使用 Pixel 6 及以上版本，以支持 MTE (Memory Tagging Extension) 等现代硬件安全特性。

---

## 3. 代码导航与关键路径

### 在线搜索
- **[cs.android.com](https://cs.android.com)**：支持交叉引用的官方代码搜索工具。

### AOSP 关键目录索引
| 路径 | 说明 |
|------|------|
| `frameworks/base/` | Java Framework 核心实现 |
| `frameworks/native/` | Native Framework (Binder, SurfaceFlinger) |
| `system/core/` | 系统核心组件 (init, adbd, logd) |
| `system/sepolicy/` | SELinux 策略定义 |
| `bionic/` | Android C 库实现 |
| `packages/modules/Virtualization/` | AVF / pKVM 相关实现 |

---

## 4. 参考资源

- **官方文档**：[source.android.com](https://source.android.com)
- **安全公告**：[Android Security Bulletins](https://source.android.com/docs/security/bulletin)
- **内核文档**：[source.android.com/docs/core/architecture/kernel](https://source.android.com/docs/core/architecture/kernel)
