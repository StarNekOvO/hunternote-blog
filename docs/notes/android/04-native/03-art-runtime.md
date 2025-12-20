# 4x03 - Android Runtime (ART)

Android Runtime (ART) 是 Android 上应用（以及部分系统服务）使用的托管式运行时，取代了早期的 Dalvik。

在安全研究里，ART 的位置很特殊：它既是“应用代码的执行引擎”，也是“大量复杂 native 代码”的集合。很多高危漏洞都出现在：

- DEX/ODEX/OAT 解析
- JIT/AOT 编译器
- 解释器与 runtime 边界（JNI、反射、类加载）

## 1. 核心机制
- **AOT (Ahead-of-Time)**: 安装时编译。
- **JIT (Just-in-Time)**: 运行时编译。
- **DEX 格式**: 优化的字节码格式。

补充几个常见对象：

- **boot image**：系统核心类的预编译镜像
- **oat/vdex**：与编译产物相关的文件格式（版本演进较快）
- **profile-guided**：JIT/安装时优化会参考热点 profile

## 2. 代表性CVE案例

### 2.1 CVE-2017-13156 (DEX解析整数溢出)

**位置**：DEX文件解析

**根因**：计算DEX代码区大小时整数溢出

```c
// 简化的漏洞代码
uint32_t code_size = insns_size_in_code_units * 2;  // 溢出
void *code_buf = malloc(code_size);  // 分配过小
// 后续拷贝导致堆溢出
```

**影响**：加载恶意DEX文件可导致RCE

### 2.2 CVE-2020-0041 (JIT类型混淆)

**位置**：ART JIT编译器

**根因**：JIT优化时对对象类型推断错误

**攻击链**：
```text
1. 构造特定Java代码模式
2. 触发JIT编译
3. 编译器类型推断错误
4. 生成错误的机器码
5. 运行时类型混淆
6. 内存破坏/RCE
```

### 2.3 CVE-2021-0642 (Verifier绕过)

**位置**：DEX字节码验证器

**根因**：Verifier对特定指令序列的分析不完整

**触发**：
```text
构造畸形字节码 → 通过Verifier检查
→ 运行时违反类型安全
→ 内存破坏
```

### 2.4 CVE-2021-0928 (ClassLoader信息泄露)

**根因**：多ClassLoader场景下类加载错误

**影响**：恶意应用可访问其他应用的类/数据

## 3. 安全研究重点

更细化的研究切面：

### 3.1 DEX/字节码解析面

- 解析不可信 DEX（或被篡改的优化产物）时的边界检查
- 验证器（verifier）与运行时语义不一致导致的漏洞

### 3.2 JIT/AOT 编译面

- JIT 编译器对特定字节码模式的优化错误
- 去优化/回退路径的状态一致性
- 与 GC/线程协作的并发边界

### 3.3 类加载与反射

动态加载本身不是漏洞，但经常作为攻击链的一环：

- `DexClassLoader`/`PathClassLoader` 的来源路径与完整性
- 多 dex/多 classloader 时的类冲突与覆盖
- 反射/隐藏 API 的访问与限制绕过（版本相关）

## 4. 典型数据流（概念级）

### 4.1 应用安装/更新

安装后常见会触发：

- dex 优化（dex2oat 等组件，版本差异较大）
- profile 收集与后续编译策略调整

### 4.2 应用运行

- 冷启动：解释执行 + 部分预编译
- 运行中：热点方法进入 JIT，生成机器码
- 压力下：GC、线程切换、去优化路径可能被触发

## 5. 调试与观测

### 5.1 崩溃与堆栈

- Java 崩溃（exception）与 native 崩溃（tombstone）要区分处理
- ART 相关 native 崩溃往往需要结合符号与版本源码定位

### 5.2 常见观测手段

- `logcat` 过滤 `art`/`dex2oat` 相关日志
- 结合 `perfetto`/trace 观察编译与 GC 行为（研究性能/竞态很有用）
- 使用动态插桩（例如 Frida）验证函数调用路径（注意版本与反调试影响）

## 6. 审计 checklist

1. 对外可控的 DEX/字节码输入点有哪些（下载模块、插件、热更新等）
2. classloader 来源路径是否可信，是否做完整性校验
3. 是否存在“低权限输入驱动高权限执行”的代理路径（例如系统进程加载外部 dex）
4. 编译/优化产物的落盘位置与权限是否可能被篡改

- https://source.android.com/docs/core/runtime — ART/Dalvik 总览（AOT/JIT/GC/调试特性与相关链接）
- https://source.android.com/docs/core/runtime/dex-format — DEX 文件格式（字节码与解析面相关）
- https://source.android.com/docs/core/runtime/jit-compiler — ART JIT 编译器实现与关键机制
- https://source.android.com/docs/core/runtime/art-ti — ART TI（运行时插桩/调试接口，研究与可观测性相关）
