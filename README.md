# PicoClaw Android App

PicoClaw Android 客户端，将 PicoClaw 打包为 Android APK。

## 快速开始

### 方法一：一键初始化（推荐）

```powershell
# 克隆仓库
git clone --recursive https://github.com/zhp821/picoclaw-app.git
cd picoclaw-app

# 运行初始化脚本（自动下载依赖并编译）
.\scripts\init.ps1
```

### 方法二：手动步骤

```powershell
# 1. 克隆仓库
git clone https://github.com/zhp821/picoclaw-app.git
cd picoclaw-app

# 2. 初始化 submodule
git submodule update --init --recursive

# 3. 安装依赖
cd picoclaw/web/frontend
npm install
cd ../..
npm install

# 4. 编译 APK
.\scripts\build-apk.ps1
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
│       └── assets/             # 静态资源 (前端 dist, Go 二进制)
├── scripts/
│   ├── init.ps1                # 初始化脚本
│   └── build-apk.ps1           # 编译脚本
└── config.json                 # 默认配置文件
```

## 系统要求

- **Git**: https://git-scm.com/downloads
- **Node.js**: https://nodejs.org/ (LTS 版本)
- **Go**: https://go.dev/dl/ (1.21+)
- **Java JDK**: https://adoptium.net/ (17 或 21)
- **Android SDK**: https://developer.android.com/studio#command-tools

## 安装到设备

```powershell
# 连接设备后安装
adb install -r PicoClaw-android.apk

# 或使用 Android Studio 安装
```

## 开发说明

### 更新 PicoClaw 核心代码

```bash
# 进入 submodule
cd picoclaw
git pull origin main
cd ..

# 提交更新
git add picoclaw
git commit -m "Update picoclaw submodule"
```

### 自定义配置

修改 `config.json` 来更改默认设置：

```json
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 18790
  },
  "agents": {
    "defaults": {
      "model_name": "your-model"
    }
  }
}
```

## 常见问题

### submodule 为空

```bash
git submodule update --init --recursive
```

### 构建失败

```powershell
# 清理后重新构建
.\scripts\init.ps1 -Force
```

### 端口占用

后端使用端口 18800 (Web) 和 18790 (Gateway)，确保这些端口未被占用。

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 相关链接

- PicoClaw 核心: https://github.com/zhp821/picoclaw
- 文档: https://docs.picoclaw.io
