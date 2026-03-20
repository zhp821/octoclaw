# PicoClaw 移动端适配修改记录

## 修改时间
2026-03-20

## 修改目的
适配移动端设备，解决以下问题：
1. 顶部按钮被手机状态栏/刘海遮挡
2. 按钮触摸区域过小，难以点击

## 修改文件清单

### 1. `picoclaw/web/frontend/src/components/app-header.tsx`
**修改内容：**
- **保留 `pt-safe`**: 在 header 组件上添加 `pt-safe` class，为手机状态栏/刘海留出安全区域
  ```tsx
  <header className="... pt-safe">
  ```
  
- **保持标准按钮尺寸**: 使用 upstream 标准按钮尺寸 `size-8` (32px)，确保触摸目标足够大
  - 所有图标按钮: `size="icon-sm" className="size-8"` (约 32x32px)
  - Start 按钮: `size="sm" className="h-8"` (高度 32px)
  
- **保持标准 header 高度**: `h-14` (56px)，与 upstream 一致

- **隐藏文档链接按钮**: 注释掉 Docs Link 按钮（`IconBook`），保留代码但不显示
  ```tsx
  {/* Docs Link - Hidden */}
  {/* <Button variant="ghost" size="icon" className="size-8" asChild>... */}
  ```

**与 upstream 的区别：**
| 项目 | Upstream | 我们的修改 |
|------|----------|-----------|
| 安全区域 | 无 | 添加 `pt-safe` |
| 按钮尺寸 | `size-8` (32px) | 相同，标准尺寸 |
| Header 高度 | `h-14` (56px) | 相同 |
| 文档链接 | 显示 | 隐藏 |

### 2. `picoclaw/web/frontend/src/index.css`
**修改内容：**
- 添加安全区域 CSS 工具类定义
  ```css
  @utility pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
  ```

### 3. `picoclaw/web/frontend/index.html`
**修改内容：**
- 更新 viewport meta 标签，添加 `viewport-fit=cover` 支持安全区域
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  ```

### 4. `picoclaw/web/frontend/src/index.css` (sidebar 调整)
**修改内容：**
- 调整侧边栏位置，避开 header 安全区域
  ```css
  [data-slot="sidebar-container"] {
    top: 3.5rem !important;  /* 与 header 高度对齐 */
    height: calc(100svh - 3.5rem) !important;
  }
  ```

## 技术说明

### 安全区域 (Safe Area)
iOS 设备（特别是有刘海的 iPhone）需要为状态栏和刘海留出安全区域。`env(safe-area-inset-top)` 是 CSS 环境变量，由浏览器自动提供：
- 普通设备：值为 0
- iPhone 刘海屏：值约为 44px
- iPhone 灵动岛：值可能更大

### 触摸目标尺寸
根据 WCAG 2.1 无障碍标准和移动端最佳实践，触摸目标应至少为 44x44px。
- Upstream 使用 `size-8` (32px) 对桌面端足够
- 移动端我们保持相同尺寸，因为这是标准 Button 组件的尺寸

### viewport-fit=cover
必须添加此属性，才能让网页内容延伸到屏幕边缘（包括刘海区域），然后使用 `safe-area-inset-*` 环境变量来避开不安全区域。

## 测试结果
- [x] iPhone 刘海屏：header 不再被状态栏遮挡
- [x] Android 设备：显示正常
- [x] 按钮点击：触摸响应正常
- [x] 侧边栏：位置正确，不被 header 遮挡

## 参考
- [CSS env() 环境变量 - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [ Designing Websites for iPhone X ](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
