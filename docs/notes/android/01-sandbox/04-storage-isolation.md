# 1x03 - 存储隔离 (Scoped Storage)

Android 的存储机制经历了一场从“公共广场”到“私人公寓”的变革。这场变革的核心目标是保护用户隐私并防止应用乱占空间。

## 1. 存储权限的演进

### 1.1 黑暗时代 (Android 9 以前)
- **机制**: 应用只要申请了 `READ_EXTERNAL_STORAGE` 或 `WRITE_EXTERNAL_STORAGE` 权限，就可以访问 `/sdcard` 下的所有文件。
- **风险**: 恶意应用可以读取其他应用的公开数据（如照片、文档），甚至在 SD 卡根目录乱建文件夹。

### 1.2 现代文明：Scoped Storage (Android 10+)
- **机制**: 应用默认只能访问自己的私有目录（`/sdcard/Android/data/<pkg>`）和公共媒体库（通过 MediaStore）。
- **隔离**: 即使拥有存储权限，应用也无法直接通过文件路径访问其他应用的私有文件。

## 2. 底层实现：FUSE 与 Sdcardfs

为了实现 Scoped Storage，Android 在文件系统层做了大量工作：

- **Sdcardfs**: 早期用于模拟 FAT32 权限的内核驱动，但无法提供细粒度的视图隔离。
- **FUSE (Filesystem in Userspace)**: 现代 Android 使用 FUSE 挂载 `/sdcard`。当应用尝试访问文件时，请求会转发到用户空间的 `MediaProvider`。
- **视图过滤**: `MediaProvider` 根据应用的 UID 和权限，动态决定该应用能看到哪些文件。这种机制实现了“同一个路径，不同的视图”。

## 3. 访问外部存储的合法途径

### 3.1 MediaStore API
用于访问照片、视频和音频。应用不需要权限即可贡献文件到媒体库，但读取他人文件需要用户授权。

### 3.2 Storage Access Framework (SAF)
通过系统选择器（Picker）让用户选择特定的文件或目录。
- **安全优势**: 应用不需要任何存储权限，因为它只获得了用户明确选择的那个文件的临时访问权。

### 3.3 FileProvider
用于在应用间安全地共享文件。

**安全配置示例 (`res/xml/file_paths.xml`)**:
```xml
<paths>
    <!-- 仅共享私有缓存目录下的 images 子目录 -->
    <cache-path name="my_images" path="images/" />
</paths>
```

**AndroidManifest.xml**:
```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.example.app.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

## 4. CVE 案例分析：路径遍历与符号链接攻击

存储系统的复杂性往往源于对路径处理的不当。

- **路径遍历 (Path Traversal)**: 如果应用在处理 `FileProvider` 的 URI 时没有过滤 `../`，攻击者可以构造 `content://.../../../data/system/accounts.db` 来窃取系统数据库。
- **符号链接攻击 (Symlink Attack)**: 在 Scoped Storage 引入前，攻击者可以在公共目录创建一个指向私有目录的符号链接。如果高权限进程（如媒体扫描器）盲目跟随链接，就会导致越权读写。

## 5. 总结：Android 9 vs Android 11 差异对比

| 特性 | Android 9 (Legacy) | Android 11 (Scoped) |
| :--- | :--- | :--- |
| **直接文件访问** | 允许访问整个 `/sdcard` | 仅限私有目录和特定媒体目录 |
| **权限要求** | 需要 `READ/WRITE` 权限 | 访问媒体库需要权限，SAF 不需要 |
| **底层挂载** | 通常是 sdcardfs | 强制使用 FUSE 视图隔离 |
| **隐私保护** | 弱，应用可互相偷窥 | 强，默认完全隔离 |

## 参考（AOSP）

- https://source.android.com/docs/core/storage — Android 存储架构总览：传统存储与模拟存储。
- https://source.android.com/docs/core/storage/scoped — 分区存储（Scoped Storage）：Android 10+ 的存储隔离机制。
- 应用沙盒（Android 10+ 的已过滤存储空间视图、共享文件指南等）：https://source.android.com/docs/security/app-sandbox
