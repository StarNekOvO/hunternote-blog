# Playing With Programs 🔤


**这个页面几乎是AI写的**

**作为后端工程师, 这个模块(编码、Web、常见工具、SQL)太基础了, 整个模块直接跳过**

## 模块概述

Playing With Programs 模块分为四个子模块：数据处理（Dealing with Data）、Web交互（Talking Web）、程序误用（Program Misuse）和SQL练习场（SQL Playground），旨在全面提升对软件交互和数据处理的理解。

## Dealing with Data (19 个挑战)

数据处理模块专注于数据格式、编码和处理技巧。挑战涉及：

- 数据格式转换和解析
- 编码/解码技术
- 数据验证和清理
- 文件格式处理

## Talking Web (36 个挑战)

Web交互模块涵盖Web技术和网络通信：

- HTTP协议和请求处理
- Web API交互
- 网络数据传输
- Web安全基础概念

## Program Misuse (51 个挑战)

程序误用模块包含一系列挑战，其中标准程序被设置为 set-user-ID (suid) 权限。目标是利用这些程序的提升权限来读取 flag。

### 典型挑战程序：
- **cat**：直接读取 flag 文件
- **more**：利用分页查看器读取 flag
- **wc**：字数统计工具的权限滥用
- **gcc**：编译器的权限利用
- **as**：汇编器的权限滥用
- **wget**：下载工具的利用
- **ssh-keygen**：通过加载自定义插件代码访问 flag

建议通过查阅每个程序的手册页（`man` pages）来理解其功能和潜在漏洞。

## SQL Playground (10 个挑战)

SQL练习场模块专注于数据库查询和SQL注入基础：

- SQL查询语法和优化
- 数据库操作基础
- SQL安全意识
- 数据检索和处理技巧
