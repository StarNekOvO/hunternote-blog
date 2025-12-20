# 7x00 - WebView Security

WebView 是 Android 应用中嵌入网页的核心组件，也是最复杂的攻击面之一。

WebView 的复杂性来自三重叠加：

- 浏览器内核（Chromium）本身复杂
- App 与 Web 的桥接（JS interface、URL scheme、深链）
- 混合安全边界（同一应用进程、渲染进程、系统服务协同）

## 1. 架构隔离
- **渲染进程**: 通常运行在独立的沙箱进程中，并受到 SELinux/seccomp 等机制约束（具体策略取决于系统版本与 WebView Provider 实现）。
- **Site Isolation**: 防止不同域名的网页共享同一个进程。

补充：WebView 采用多进程架构后，很多漏洞的影响会被限制在渲染进程，但“桥接面”仍然可能把低权限的网页输入带回到高权限的应用逻辑。

## 2. 常见漏洞
- **JS Bridge 注入**: 网页通过 `addJavascriptInterface` 调用 Java 代码。
- **跨站脚本 (XSS)**: 导致敏感 Cookie 泄露。
- **File 协议漏洞**: 允许网页读取应用的私有文件。

补充一组更贴近 AppSec 的高频问题：

### 2.1 不可信 URL 被加载

- `loadUrl()` 的参数来源可控（deep link、二维码、分享链路）
- `shouldOverrideUrlLoading()` 里放行过宽
- 未限制 scheme（`file://`、`content://`、自定义 scheme）

### 2.2 JS Bridge 风险面

`addJavascriptInterface` 的风险不在于“存在”，而在于：

- 暴露的方法是否包含敏感能力（文件、账户、支付、系统设置）
- 是否允许来自不可信域名的页面调用
- 是否存在参数注入导致路径遍历/命令拼接/反序列化等二次漏洞

### 2.3 WebView 设置项导致的边界变化

- `setJavaScriptEnabled(true)`：必要但提升攻击面
- `setAllowFileAccess` / `setAllowFileAccessFromFileURLs` / `setAllowUniversalAccessFromFileURLs`：文件协议相关高风险
- mixed content 策略：HTTP/HTTPS 混用可能引入降级攻击

## 3. 安全审计 checklist（App 侧）

1. 所有 `loadUrl`/`loadDataWithBaseURL` 的来源是否可信
2. 是否存在对外可控的 deep link 直接打开 WebView
3. JS bridge 暴露方法是否最小化，是否按域名/来源做访问控制
4. 是否存在自定义 scheme 回调把网页输入带入敏感逻辑
5. Cookie/存储策略是否符合预期（敏感业务场景尤其重要）

## 4. 排查与验证

### 4.1 进程与组件定位

- `adb shell ps -A | grep -i webview`
- `adb logcat | grep -iE 'chromium|webview|crashpad'`

### 4.2 行为验证思路

- 通过最小页面验证 JS bridge 是否可调用
- 通过构造 URL 验证 scheme/host/path 白名单是否生效

## 5. 关联阅读

- `/notes/android/02-ipc/02-intent-system`（deep link/URI 作为输入通道）
- `/notes/android/04-native/03-seccomp`（渲染进程沙箱的 syscall 收窄）

## 参考（AOSP）

- https://source.android.com/docs/core/ota/modular-system/webview — WebView 模块：通过 Mainline 机制进行独立更新的说明。
- https://source.android.com/docs/security/app-sandbox — 应用沙盒与纵深防御入口（SELinux/seccomp 等），用于对齐“多进程隔离 + 内核边界收窄”的官方口径。
- https://source.android.com/docs/core/ota/modular-system — Mainline 机制入口：理解系统组件如何在常规发布周期外分发安全修复（AOSP vs GMS 签名差异也在此页有说明）。
- https://source.android.com/docs/security/bulletin — 安全公告入口：用于把 WebView/浏览器类风险放到补丁分发与版本范围里对齐。
