# PicoClaw 修改对比报告

## 报告信息
- **生成时间**: 2026-03-20
- **对比仓库**: https://github.com/sipeed/picoclaw
- **工作目录**: D:\picoclaw-app
- **分支状态**: picoclaw 子模块领先 upstream 30 个提交

---

## 修改文件清单

### 类别 1：移动端适配

| 文件 | 状态 | 修改目的 |
|------|------|----------|
| `picoclaw/web/frontend/src/components/app-header.tsx` | 修改 | 添加安全区域支持，隐藏 gateway 控制按钮（移动端由后端自动管理） |
| `picoclaw/web/frontend/src/index.css` | 修改 | 添加安全区域工具类（pt-safe, pb-safe, pl-safe, pr-safe） |
| `picoclaw/web/frontend/index.html` | 修改 | 添加 viewport-fit=cover 支持刘海屏适配 |
| `picoclaw/web/frontend/src/i18n/locales/zh.json` | 修改 | 更新中文翻译，添加模型连接失败提示 |
| `picoclaw/web/frontend/src/i18n/locales/en.json` | 修改 | 更新英文翻译，添加模型连接失败提示 |

### 类别 2：功能增强

| 文件 | 状态 | 修改目的 |
|------|------|----------|
| `picoclaw/web/backend/api/models.go` | 修改 | 添加模型连接验证功能，自动设置默认模型，自动启动 gateway |
| `picoclaw/web/backend/api/models_test.go` | 修改 | 添加模型验证测试用例 |
| `picoclaw/web/frontend/src/components/models/add-model-sheet.tsx` | 修改 | 添加模型连接失败错误处理 |
| `picoclaw/web/backend/tray_android.go` | 新增 | Android 平台系统托盘替代实现（自动启动 gateway） |

### 类别 3：开发工具

| 文件 | 状态 | 修改目的 |
|------|------|----------|
| `scripts/dev.bat` | 修改 | 优化开发脚本，支持单端口模式（18800） |
| `scripts/dev.ps1` | 修改 | 添加 -dev 模式支持 Vite HMR 热重载 |
| `scripts/gateway.bat` | 新增 | Gateway 独立启动脚本（端口 18790） |
| `scripts/gateway.ps1` | 新增 | Gateway PowerShell 启动脚本 |
| `scripts/build-apk.ps1` | 修改 | 优化 APK 构建流程，添加 -Sync 参数支持同步 upstream |

### 类别 4：配置管理

| 文件 | 状态 | 修改目的 |
|------|------|----------|
| `.gitignore` | 修改 | 保持与 upstream 一致（无实质变化） |

---

## 详细对比

### 1. app-header.tsx

**修改类型**: 移动端适配

**Upstream 版本**:
```tsx
<header className="bg-background/95 supports-backdrop-filter:bg-background/60 border-b-border/50 sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur">
```

**当前版本**:
```tsx
<header className="bg-background/95 supports-backdrop-filter:bg-background/60 border-b-border/50 sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur pt-safe">
```

**差异说明**:
- 添加了 `pt-safe` class 支持移动端刘海屏安全区域
- 将 Gateway 控制按钮包裹在 `<div className="hidden">` 中，在移动端隐藏
- 原因：Android 版本中 gateway 由后端自动管理，不需要前端控制

---

### 2. index.css

**修改类型**: 移动端适配

**Upstream 版本**: 无安全区域工具类

**当前版本**:
```css
/* Safe area utilities for mobile devices */
@utility pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}

@utility pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@utility pl-safe {
  padding-left: env(safe-area-inset-left, 0px);
}

@utility pr-safe {
  padding-right: env(safe-area-inset-right, 0px);
}
```

**差异说明**:
- 新增 4 个安全区域工具类
- 使用 CSS env() 函数读取设备安全区域插槽
- 用于适配刘海屏、挖孔屏等现代移动设备

---

### 3. index.html

**修改类型**: 移动端适配

**Upstream 版本**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**当前版本**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**差异说明**:
- 添加 `viewport-fit=cover` 属性
- 使页面内容扩展到设备的安全区域之外
- 配合 CSS 安全区域工具类实现完整的刘海屏适配

---

### 4. zh.json / en.json

**修改类型**: 功能增强

**Upstream 版本**:
```json
{
  "models": {
    "loadError": "加载模型列表失败",
    // ... 无 connectionFailed 字段
  }
}
```

**当前版本**:
```json
{
  "models": {
    "loadError": "加载模型列表失败",
    "connectionFailed": "连接失败：无法连接到 API。请检查您的 API 密钥和端点配置是否正确。",
    "added": "模型添加成功",
    "defaultModelSet": "已设为默认模型"
  }
}
```

**差异说明**:
- 添加 `connectionFailed` 翻译用于模型连接失败提示
- 添加 `added` 和 `defaultModelSet` 翻译用于模型添加成功反馈
- 中英文版本同步更新

---

### 5. add-model-sheet.tsx

**修改类型**: 功能增强

**Upstream 版本**: 基本错误处理

**当前版本**:
```typescript
} catch (e) {
  const errorMessage = e instanceof Error ? e.message : t("models.add.saveError")
  if (errorMessage.includes("Connection test failed") || errorMessage.includes("400")) {
    toast.error(t("models.connectionFailed"))
  } else {
    toast.error(errorMessage)
  }
}
```

**差异说明**:
- 添加特定的连接失败错误检测
- 区分连接测试失败和其他类型的错误
- 提供更友好的错误提示信息

---

### 6. models.go

**修改类型**: 功能增强

**Upstream 版本**: 基础模型管理（添加、更新、删除、列表）

**当前版本**:

**新增功能 1: 模型连接验证**
```go
func validateModelConnection(mc config.ModelConfig) error {
  provider, modelID, err := providers.CreateProviderFromConfig(&mc)
  // ... 实际发送测试消息验证连接
}
```

**新增功能 2: 自动设置默认模型**
```go
// Auto-set as default model if no default is configured
wasFirstModel := strings.TrimSpace(cfg.Agents.Defaults.GetModelName()) == ""
if wasFirstModel {
  cfg.Agents.Defaults.ModelName = mc.ModelName
  // ...
}
```

**新增功能 3: 自动启动 Gateway**
```go
// Auto-start gateway if this was the first model added
if wasFirstModel {
  go h.TryAutoStartGateway()
}
```

**差异说明**:
- 添加模型连接验证，确保配置的模型可以正常连接
- 首次添加模型时自动设置为默认模型
- 首次添加模型后自动启动 gateway 服务
- 自动设置 workspace 路径

---

### 7. tray_android.go (新增)

**修改类型**: 平台适配

**Upstream 版本**: 无此文件

**当前版本**:
```go
//go:build android

package main

func runTray() {
  // Android 不使用系统托盘，直接启动 gateway
  // 检查默认模型配置后自动启动 gateway
}
```

**差异说明**:
- 为 Android 平台提供专门的系统托盘替代实现
- Android 不使用图形化托盘，改为自动启动 gateway
- 检查配置文件中的默认模型，有配置才启动 gateway

---

### 8. models_test.go

**修改类型**: 测试增强

**Upstream 版本**: 基础测试用例

**当前版本**: 新增以下测试函数

| 测试函数 | 目的 |
|----------|------|
| `TestHandleListModels_ConfiguredStatusUsesRuntimeProbesForLocalModels` | 测试本地模型运行时探测 |
| `TestHandleListModels_ConfiguredStatusForOAuthModelWithCredential` | 测试 OAuth 模型凭据验证 |
| `TestHandleListModels_ProbesLocalModelsConcurrently` | 测试并发模型探测 |
| `TestHandleListModels_NormalizesWildcardLocalAPIBaseForProbe` | 测试通配符地址归一化 |
| `TestHandleAddModel_WithValidConnection` | 测试有效连接模型添加 |
| `TestHandleAddModel_InvalidConnection` | 测试无效连接模型添加 |

**差异说明**:
- 新增 6 个测试用例覆盖模型验证功能
- 测试连接测试、并发探测、地址归一化等场景

---

### 9. 启动脚本 (dev.bat, dev.ps1)

**修改类型**: 开发体验优化

**Upstream 版本**: 无这些文件

**当前版本**:

**dev.bat/dev.ps1 新增功能**:
- `-dev` 参数：启用 Vite HMR 热重载模式
- `-back` 参数：仅启动后端（不重新构建前端）
- 自动设置环境变量：`PICOCLAW_CONFIG`, `PICOCLAW_HOME`, `PICOCLAW_LOG_DIR`
- 单端口模式（18800）：前端 + API 统一端口

**gateway.bat/gateway.ps1 (新增)**:
- 独立启动 Gateway 服务（端口 18790）
- 用于开发时单独调试 Gateway

---

### 10. build-apk.ps1

**修改类型**: 构建流程优化

**Upstream 版本**: 基础构建脚本

**当前版本**:
- 添加 `-Sync` 参数：构建前自动同步 upstream
- 添加 `-Platform` 参数：支持 android/ios/both 平台选择
- 优化依赖安装流程
- 改进错误处理和日志输出

---

## 测试验证

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 移动端显示正常 | ✅ | 刘海屏适配完成，安全区域生效 |
| 配置热重载生效 | ✅ | Vite HMR 模式工作正常 |
| 模型验证正常工作 | ✅ | 添加模型时自动验证连接 |
| Gateway 自动启动 | ✅ | 首次添加模型后自动启动 |
| 模型测试通过 | ✅ | 6 个新测试用例全部通过 |

---

## 风险评估

| 修改 | 风险等级 | 说明 |
|------|----------|------|
| app-header.tsx | 🟢 低 | UI 调整，隐藏按钮不影响核心逻辑 |
| index.css | 🟢 低 | 纯新增工具类，无破坏性变更 |
| index.html | 🟢 低 | viewport 属性扩展，兼容性良好 |
| 国际化文件 | 🟢 低 | 新增翻译字段，无破坏性变更 |
| add-model-sheet.tsx | 🟢 低 | 错误处理增强，向后兼容 |
| models.go | 🟡 中 | 新增连接验证，可能影响添加模型速度 |
| tray_android.go | 🟢 低 | 新增平台支持文件，无影响 |
| models_test.go | 🟢 低 | 纯测试文件，无生产影响 |
| 启动脚本 | 🟢 低 | 开发工具脚本，无生产影响 |
| build-apk.ps1 | 🟢 低 | 构建脚本优化，功能增强 |

---

## 提交记录摘要

本地 picoclaw 子模块领先 upstream 30 个提交，主要包含：

1. **移动端适配** (5 个文件): 刘海屏安全区域支持
2. **功能增强** (4 个文件): 模型验证、自动启动、错误处理
3. **测试覆盖** (1 个文件): 新增 6 个测试用例
4. **开发工具** (5 个文件): 脚本优化、构建流程改进

---

## 建议

1. **upstream 同步**: 当前领先 30 个提交，建议定期同步 upstream 更新
2. **测试覆盖**: 模型验证功能已添加测试，建议持续维护
3. **文档更新**: 启动脚本的新参数（如 `-dev`, `-Sync`）建议更新到开发文档
4. **移动端优化**: 刘海屏适配已完成，可考虑进一步优化小屏幕布局

---

*报告生成完成*
