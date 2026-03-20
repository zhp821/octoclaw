# PicoClaw 移动端适配修改记录

## 修改时间
2026-03-20

## 修改目的
适配移动端设备，解决以下问题：
1. 顶部 header 被手机状态栏/刘海遮挡

## 修改文件清单

### 1. `picoclaw/web/frontend/src/components/app-header.tsx`
**修改内容：**
- 添加 `pt-safe` class 到 header，为手机状态栏/刘海留出安全区域
  ```tsx
  <header className="... pt-safe">
  ```
- Gateway 控制按钮用 `<div className="hidden">` 包裹隐藏，但保留代码

**与 upstream 的区别：**
| 项目 | Upstream | 我们的修改 |
|------|----------|-----------|
| 安全区域 | 无 | 添加 `pt-safe` |
| Gateway 按钮 | 显示 | 隐藏（代码保留）|
| 按钮尺寸 | `size-8` (32px) | 相同，标准尺寸 |
| Header 高度 | `h-14` (56px) | 相同 |

### 2. `picoclaw/web/frontend/src/index.css`
**修改内容：**
- 添加安全区域 CSS 工具类定义（保留）
  ```css
  @utility pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
  ```
- 恢复 sidebar 高度为 3.5rem（与 upstream 一致）

### 3. `picoclaw/web/frontend/index.html`
**修改内容：**
- 添加 `viewport-fit=cover` 支持安全区域（保留）
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```

## 技术说明

### 安全区域 (Safe Area)
iOS 设备（特别是有刘海的 iPhone）需要为状态栏和刘海留出安全区域。`env(safe-area-inset-top)` 是 CSS 环境变量，由浏览器自动提供：
- 普通设备：值为 0
- iPhone 刘海屏：值约为 44px
- iPhone 灵动岛：值可能更大

### viewport-fit=cover
必须添加此属性，才能让网页内容延伸到屏幕边缘（包括刘海区域），然后使用 `safe-area-inset-*` 环境变量来避开不安全区域。

## 测试结果
- [x] iPhone 刘海屏：header 不再被状态栏遮挡
- [x] Android 设备：显示正常
- [x] 按钮点击：触摸响应正常
- [x] 侧边栏：位置正确，不被 header 遮挡

## 参考
- [CSS env() 环境变量 - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

---

# 模型管理功能修改记录

## 修改时间  
2026-03-20

## 功能需求
1. 隐藏 header 上的 gateway 控制按钮（由后端自动管理）
2. 用户添加或修改模型后，自动触发配置重载（无需重启 gateway）
3. 确保 gateway 配置实时生效

## 实现说明

### Gateway 配置热重载机制
PicoClaw Gateway 已经内置配置热重载功能：
- Gateway 会监听配置文件变化（通过文件系统监控）
- 当 `config.json` 被修改后，gateway 自动重新加载配置
- 无需手动重启 gateway 进程

**相关代码位置：** `picoclaw/pkg/gateway/gateway.go:490-524`

### 前端修改
**文件：** `picoclaw/web/frontend/src/components/app-header.tsx`
- 将 Gateway 控制按钮包裹在 `<div className="hidden">` 中
- 保留所有原有代码和逻辑，仅隐藏显示
- 按钮包括：重启按钮、启动/停止按钮

### 后端修改
**文件：** `picoclaw/web/backend/api/models.go`

**修改点 1 - handleAddModel：**
- 添加第一个模型时：自动启动 gateway（原有逻辑）
- 添加后续模型时：只需保存配置，gateway 自动检测并热重载

```go
// 保存配置后，gateway 会自动检测文件变化并重载
if wasFirstModel {
    go h.TryAutoStartGateway()
}
// 非第一个模型：gateway 会自动检测到配置文件变化并热重载
```

**修改点 2 - handleUpdateModel：**
- 更新模型配置后保存，gateway 自动热重载
- 无需额外调用重启 API

## 工作流程

### 添加第一个模型
1. 用户填写模型配置 → 调用 `POST /api/models`
2. 后端验证连接 → 保存配置到 `config.json`
3. `wasFirstModel=true` → 启动 gateway
4. Gateway 读取配置并开始运行

### 添加后续模型
1. 用户填写模型配置 → 调用 `POST /api/models`
2. 后端验证连接 → 保存配置到 `config.json`
3. Gateway 文件监听器检测到配置变化
4. Gateway 自动重新加载配置，新模型生效

### 修改模型
1. 用户修改模型配置 → 调用 `PUT /api/models/{index}`
2. 后端保存配置到 `config.json`
3. Gateway 文件监听器检测到配置变化
4. Gateway 自动重新加载配置，修改生效

## 优势

1. **无缝更新**：用户添加/修改模型后无需手动重启服务
2. **零停机**：配置热重载不会中断正在进行的对话
3. **简化 UI**：隐藏 gateway 控制按钮，减少用户困惑
4. **自动管理**：后端自动处理配置生效，无需用户干预

## 注意事项

1. 模型配置验证（连接测试）会在保存前执行，确保配置有效
2. 如果验证失败，配置不会保存，gateway 保持原配置运行
3. 配置热重载有约 500ms 的延迟（防抖处理）

## 测试验证

- [x] 添加第一个模型：gateway 自动启动
- [x] 添加后续模型：配置自动生效
- [x] 修改模型：配置自动生效  
- [x] 配置验证失败：gateway 保持原配置

## 参考文档
- `docs/mobile-adaptation.md` - 移动端适配记录
- `picoclaw/pkg/gateway/gateway.go` - Gateway 配置热重载实现
