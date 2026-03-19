# PicoClaw Android App

PicoClaw Android 客户端，将 PicoClaw 打包为 Android APK。

## 快速开始

### 一键初始化（推荐）

```powershell
# 克隆仓库（包含 submodule）
git clone --recursive https://github.com/zhp821/picoclaw-app.git
cd picoclaw-app

# 运行初始化脚本（自动配置 upstream 并同步最新代码）
.\scripts\init.ps1
```

初始化完成后，代码已同步 upstream (https://github.com/sipeed/picoclaw) 最新版本。

### 编译 APK

```powershell
# 编译 APK
.\scripts\build-apk.ps1

# 安装到设备
adb install -r PicoClaw-android.apk
```

## 项目结构

```
picoclaw-app/                    # 本仓库（Android 包装器）
├── picoclaw/                    # submodule: PicoClaw 核心代码
│   ├── web/frontend/            # React 前端
│   ├── web/backend/             # Go 后端
│   └── pkg/                     # Go 核心包
├── android/                     # Android 原生代码
│   └── app/src/main/
│       ├── java/               # Java 代码 (SplashActivity, MainActivity, GoBackendService)
│       └── assets/             # 静态资源
├── scripts/
│   ├── init.ps1                # 初始化脚本（配置 upstream + 同步代码）
│   └── build-apk.ps1           # 编译脚本
└── config.json                 # 默认配置文件
```

## 系统要求

- **Git**: https://git-scm.com/downloads
- **Node.js**: https://nodejs.org/ (LTS 版本)
- **Go**: https://go.dev/dl/ (1.21+)
- **Java JDK**: https://adoptium.net/ (17 或 21)
- **Android SDK**: https://developer.android.com/studio#command-tools

## 使用说明

### 首次使用

```powershell
# 1. 克隆仓库
git clone --recursive https://github.com/zhp821/picoclaw-app.git
cd picoclaw-app

# 2. 初始化（自动配置 upstream 并同步最新代码）
.\scripts\init.ps1

# 3. 编译 APK
.\scripts\build-apk.ps1
```

### 更新上游代码

Picoclaw submodule 配置了两个 remote：
- `origin`: 你的 fork (zhp821/picoclaw)
- `upstream`: 官方仓库 (sipeed/picoclaw)

```powershell
# 方法 1：使用 init 脚本
.\scripts\init.ps1

# 方法 2：手动更新
cd picoclaw
git fetch upstream
git reset --hard upstream/main
cd ..
git add picoclaw
git commit -m "Update picoclaw to upstream latest"
```

### init 脚本选项

```powershell
# 标准初始化（同步 upstream 最新代码）
.\scripts\init.ps1

# 跳过同步（只检查环境，不更新代码）
.\scripts\init.ps1 -SkipSync

# 强制重新初始化（清理后重新配置）
.\scripts\init.ps1 -Force
```

## 常见问题

### submodule 为空

如果 `picoclaw/` 目录为空：

```bash
git submodule update --init --recursive
```

### 同步 upstream 失败

检查网络连接，然后重试：

```bash
cd picoclaw
git fetch upstream --verbose
```

### 构建失败

```powershell
# 清理后重新初始化
.\scripts\init.ps1 -Force
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 相关链接

- PicoClaw 官方: https://github.com/sipeed/picoclaw
- 文档: https://docs.picoclaw.io
