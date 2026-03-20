# Model Auto-Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在用户添加新模型时，自动测试连接并批量导入该 provider 的所有可用模型到配置文件中

**Architecture:** 修改后端 `handleAddModel` API，在保存模型前调用 provider 的 `ListModels` 接口，获取所有可用模型后批量写入 config.json，用户手动输入的模型设为默认

**Tech Stack:** Go, PicoClaw backend API, providers package, i18n

---

## 文件结构

### 需要修改的文件：
- **修改:** `picoclaw/web/backend/api/models.go` - 添加模型验证和批量导入逻辑
- **修改:** `picoclaw/web/frontend/src/locales/zh.json` - 中文 i18n 错误提示
- **修改:** `picoclaw/web/frontend/src/locales/en.json` - 英文 i18n 错误提示
- **可能修改:** `picoclaw/pkg/providers/types.go` - 确认 `ListModels` 接口定义
- **可能修改:** `picoclaw/pkg/providers/openai_compat/provider.go` - 确认 OpenAI 兼容 provider 的 `ListModels` 实现

### 测试文件：
- **现有:** `picoclaw/web/backend/api/models_test.go` - 添加集成测试

---

## 任务分解

### Task 1: 后端 API 支持模型列表获取

**Files:**
- Modify: `picoclaw/web/backend/api/models.go`
- Test: `picoclaw/web/backend/api/models_test.go`

- [ ] **Step 1: 检查 providers 包中 ListModels 接口定义**

```bash
cd D:\picoclaw-app\picoclaw
grep -r "ListModels" pkg/providers/
```

Expected: 查看哪些 provider 实现了 `ListModels` 方法

- [ ] **Step 2: 在 models.go 中添加模型验证辅助函数**

```go
// validateModelAndDiscover attempts to connect to the provider and discover all available models.
// Returns the list of discovered models or an error if connection fails.
func validateModelAndDiscover(mc config.ModelConfig) ([]config.ModelConfig, error) {
    // 创建 provider 实例
    provider, _, err := providers.CreateProviderFromConfig(&mc)
    if err != nil {
        return nil, fmt.Errorf("failed to create provider: %w", err)
    }

    // 测试连接并获取模型列表
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    models, err := provider.ListModels(ctx)
    if err != nil {
        return nil, fmt.Errorf("connection test failed: %w", err)
    }

    // 转换为 config.ModelConfig 格式
    providerName, _ := splitModel(mc.Model)
    discovered := make([]config.ModelConfig, 0, len(models))
    for _, modelName := range models {
        discovered = append(discovered, config.ModelConfig{
            ModelName:  modelName,
            Model:      fmt.Sprintf("%s/%s", providerName, modelName),
            APIBase:    mc.APIBase,
            APIKey:     mc.APIKey,
            Proxy:      mc.Proxy,
            AuthMethod: mc.AuthMethod,
        })
    }

    return discovered, nil
}
```

- [ ] **Step 3: 修改 handleAddModel 函数添加验证和批量导入逻辑**

```go
// handleAddModel appends a new model configuration entry.
// Validates connection and auto-discovers all available models from the provider.
//
//	POST /api/models
func (h *Handler) handleAddModel(w http.ResponseWriter, r *http.Request) {
    body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
    if err != nil {
        http.Error(w, "Failed to read request body", http.StatusBadRequest)
        return
    }
    defer r.Body.Close()

    var mc config.ModelConfig
    if err = json.Unmarshal(body, &mc); err != nil {
        http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
        return
    }

    if err = mc.Validate(); err != nil {
        http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
        return
    }

    // 验证连接并获取所有可用模型
    discoveredModels, err := validateModelAndDiscover(mc)
    if err != nil {
        // 返回 i18n 友好的错误信息
        http.Error(w, fmt.Sprintf("Connection test failed: unable to fetch model list. Please check your API key and endpoint. Error: %v", err), http.StatusBadRequest)
        return
    }

    cfg, err := config.LoadConfig(h.configPath)
    if err != nil {
        http.Error(w, fmt.Sprintf("Failed to load config: %v", err), http.StatusInternalServerError)
        return
    }

    // 构建去重映射
    existingModels := make(map[string]bool)
    for _, m := range cfg.ModelList {
        existingModels[m.ModelName] = true
    }

    // 批量添加发现的模型（去重）
    addedCount := 0
    for _, model := range discoveredModels {
        if !existingModels[model.ModelName] {
            cfg.ModelList = append(cfg.ModelList, model)
            existingModels[model.ModelName] = true
            addedCount++
        }
    }

    // 设置默认模型为用户手动输入的那个
    cfg.Agents.Defaults.ModelName = mc.ModelName
    provider, _ := splitModel(mc.Model)
    cfg.Agents.Defaults.Provider = provider
    
    if cfg.Agents.Defaults.Workspace == "" {
        picoHome := utils.GetPicoclawHome()
        cfg.Agents.Defaults.Workspace = filepath.Join(picoHome, "workspace")
    }

    if err := config.SaveConfig(h.configPath, cfg); err != nil {
        http.Error(w, fmt.Sprintf("Failed to save config: %v", err), http.StatusInternalServerError)
        return
    }

    // Auto-start gateway if this was the first model
    wasFirstModel := len(cfg.ModelList) <= addedCount+1
    if wasFirstModel {
        go h.TryAutoStartGateway()
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]any{
        "status":        "ok",
        "index":         len(cfg.ModelList) - 1,
        "default_model": cfg.Agents.Defaults.ModelName,
        "discovered":    addedCount,
    })
}
```

- [ ] **Step 4: 添加必要的 import**

```go
import (
    "context"
    "fmt"
    "io"
    "net/http"
    "path/filepath"
    "strconv"
    "strings"
    "sync"
    "time"

    "github.com/sipeed/picoclaw/pkg/config"
    "github.com/sipeed/picoclaw/pkg/logger"
    "github.com/sipeed/picoclaw/pkg/providers"
    "github.com/sipeed/picoclaw/web/backend/utils"
)
```

- [ ] **Step 5: 编译测试**

```bash
cd D:\picoclaw-app\picoclaw\web\backend
go build .
```

Expected: 编译成功，无错误

- [ ] **Step 6: 提交**

```bash
cd D:\picoclaw-app
git add picoclaw/web/backend/api/models.go
git commit -m "feat: auto-discover models when adding new provider"
```

---

### Task 2: 前端 i18n 错误提示

**Files:**
- Modify: `picoclaw/web/frontend/src/locales/zh.json`
- Modify: `picoclaw/web/frontend/src/locales/en.json`

- [ ] **Step 1: 查看现有 models 相关的 i18n key**

```bash
cd D:\picoclaw-app\picoclaw\web\frontend
grep -A 5 -B 5 "model" src/locales/zh.json
```

- [ ] **Step 2: 添加连接失败的错误提示（中文）**

在 `zh.json` 的 `models` 或 `errors` 部分添加：

```json
{
  "models": {
    "connectionFailed": "连接失败：无法获取模型列表。请检查您的 API 密钥和端点配置是否正确。",
    "discoveredModels": "成功发现 {{count}} 个可用模型",
    "validationError": "模型配置验证失败"
  }
}
```

- [ ] **Step 3: 添加连接失败的错误提示（英文）**

在 `en.json` 添加：

```json
{
  "models": {
    "connectionFailed": "Connection failed: unable to fetch model list. Please check your API key and endpoint configuration.",
    "discoveredModels": "Successfully discovered {{count}} available models",
    "validationError": "Model configuration validation failed"
  }
}
```

- [ ] **Step 4: 提交**

```bash
cd D:\picoclaw-app
git add picoclaw/web/frontend/src/locales/zh.json picoclaw/web/frontend/src/locales/en.json
git commit -m "feat: add i18n messages for model discovery"
```

---

### Task 3: 前端错误处理（如果需要）

**Files:**
- Modify: `picoclaw/web/frontend/src/pages/models.tsx` (或对应的模型管理页面)

- [ ] **Step 1: 查找添加模型的 API 调用代码**

```bash
cd D:\picoclaw-web\frontend
grep -r "POST.*api/models" src/
```

- [ ] **Step 2: 更新错误处理逻辑**

```typescript
try {
  const response = await fetch('/api/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(modelConfig)
  });

  if (!response.ok) {
    const error = await response.text();
    // 使用 i18n 友好的错误提示
    if (response.status === 400 && error.includes('Connection test failed')) {
      toast.error(t('models.connectionFailed'));
    } else {
      toast.error(error);
    }
    return;
  }

  const result = await response.json();
  toast.success(t('models.discoveredModels', { count: result.discovered }));
} catch (err) {
  toast.error(t('models.validationError'));
}
```

- [ ] **Step 3: 提交**

```bash
cd D:\picoclaw-app
git add picoclaw/web/frontend/src/pages/models.tsx
git commit -m "feat: handle model discovery errors in UI"
```

---

### Task 4: 集成测试

**Files:**
- Create: `picoclaw/web/backend/api/model_discovery_test.go`

- [ ] **Step 1: 创建测试文件**

```go
package api

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"

    "github.com/sipeed/picoclaw/pkg/config"
)

func TestHandleAddModel_WithDiscovery(t *testing.T) {
    // 创建临时配置文件
    tmpDir := t.TempDir()
    configPath := filepath.Join(tmpDir, "config.json")
    
    // 初始化空配置
    cfg := config.DefaultConfig()
    cfg.ModelList = []config.ModelConfig{}
    if err := config.SaveConfig(configPath, cfg); err != nil {
        t.Fatalf("Failed to create test config: %v", err)
    }

    // 创建测试 handler
    handler := &Handler{configPath: configPath}

    // 测试用例：有效的 OpenAI 配置（需要有效的 API key）
    testModel := config.ModelConfig{
        ModelName: "gpt-4o-mini",
        Model:     "openai/gpt-4o-mini",
        APIBase:   "https://api.openai.com/v1",
        APIKey:    os.Getenv("TEST_OPENAI_API_KEY"), // 从环境变量获取
    }

    body, _ := json.Marshal(testModel)
    req := httptest.NewRequest(http.MethodPost, "/api/models", bytes.NewReader(body))
    w := httptest.NewRecorder()

    handler.handleAddModel(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
    }

    // 验证配置文件中添加了多个模型
    resultCfg, _ := config.LoadConfig(configPath)
    if len(resultCfg.ModelList) < 1 {
        t.Errorf("Expected models to be discovered, got %d", len(resultCfg.ModelList))
    }

    // 验证默认模型设置为用户输入的那个
    if resultCfg.Agents.Defaults.ModelName != "gpt-4o-mini" {
        t.Errorf("Expected default model to be gpt-4o-mini, got %s", resultCfg.Agents.Defaults.ModelName)
    }
}

func TestHandleAddModel_InvalidConnection(t *testing.T) {
    tmpDir := t.TempDir()
    configPath := filepath.Join(tmpDir, "config.json")
    
    cfg := config.DefaultConfig()
    cfg.ModelList = []config.ModelConfig{}
    if err := config.SaveConfig(configPath, cfg); err != nil {
        t.Fatalf("Failed to create test config: %v", err)
    }

    handler := &Handler{configPath: configPath}

    // 测试用例：无效的 API key
    testModel := config.ModelConfig{
        ModelName: "gpt-4o",
        Model:     "openai/gpt-4o",
        APIBase:   "https://api.openai.com/v1",
        APIKey:    "invalid-key",
    }

    body, _ := json.Marshal(testModel)
    req := httptest.NewRequest(http.MethodPost, "/api/models", bytes.NewReader(body))
    w := httptest.NewRecorder()

    handler.handleAddModel(w, req)

    if w.Code != http.StatusBadRequest {
        t.Errorf("Expected status 400 for invalid connection, got %d", w.Code)
    }

    if !bytes.Contains(w.Body.Bytes(), []byte("Connection test failed")) {
        t.Errorf("Expected connection error message, got: %s", w.Body.String())
    }
}
```

- [ ] **Step 2: 运行测试（需要有效的 API key）**

```bash
cd D:\picoclaw-app\picoclaw\web\backend\api
$env:TEST_OPENAI_API_KEY="sk-..."
go test -v -run TestHandleAddModel_WithDiscovery
```

Expected: 测试通过，验证模型被批量导入

- [ ] **Step 3: 运行失败场景测试**

```bash
cd D:\picoclaw-app\picoclaw\web\backend\api
go test -v -run TestHandleAddModel_InvalidConnection
```

Expected: 测试通过，验证错误处理正确

- [ ] **Step 4: 提交**

```bash
cd D:\picoclaw-app
git add picoclaw/web/backend/api/model_discovery_test.go
git commit -m "test: add integration tests for model discovery"
```

---

### Task 5: 文档更新

**Files:**
- Modify: `README.md` 或 `docs/models.md`

- [ ] **Step 1: 更新模型配置文档**

在模型配置相关文档中添加：

```markdown
## 批量添加模型

当您添加新模型时，系统会自动：
1. 测试 API 连接
2. 获取该 provider 的所有可用模型
3. 批量导入到配置文件中（自动去重）
4. 将您手动输入的模型设为默认

这样可以一次性获得该 provider 的所有模型，无需逐个添加。
```

- [ ] **Step 2: 提交**

```bash
cd D:\picoclaw-app
git add README.md
git commit -m "docs: document auto model discovery feature"
```

---

## 测试策略

### 单元测试
- 每个函数单独测试
- Mock provider 的 `ListModels` 方法

### 集成测试
- 使用真实的 API key 测试（通过环境变量）
- 测试成功和失败两种场景

### 手动测试
1. 在模型管理页面添加新的 OpenAI 模型
2. 验证是否能获取到模型列表
3. 验证配置文件中是否添加了多个模型
4. 验证默认模型是否正确设置

---

## 预期行为

### 成功场景
**用户输入:**
```json
{
  "model_name": "gpt-4o-mini",
  "model": "openai/gpt-4o-mini",
  "api_base": "https://api.openai.com/v1",
  "api_key": "sk-..."
}
```

**返回:**
```json
{
  "status": "ok",
  "index": 5,
  "default_model": "gpt-4o-mini",
  "discovered": 10
}
```

**config.json 变化:**
- 添加了 10 个模型（gpt-4o-mini, gpt-4o, gpt-4-turbo, 等）
- `agents.defaults.model_name` 设置为 `"gpt-4o-mini"`

### 失败场景
**用户输入:**
```json
{
  "model_name": "gpt-4o",
  "model": "openai/gpt-4o",
  "api_base": "https://api.openai.com/v1",
  "api_key": "invalid-key"
}
```

**返回:**
```
HTTP 400 Bad Request
Connection test failed: unable to fetch model list. Please check your API key and endpoint. Error: authentication failed
```

---

## 注意事项

1. **超时设置:** `ListModels` 调用设置 30 秒超时，避免长时间阻塞
2. **去重逻辑:** 使用 map 确保不重复添加已有模型
3. **i18n:** 错误提示要友好且本地化
4. **部分 provider 不支持 ListModels:** 需要检查并处理 `NotImplemented` 错误
5. **API 费用:** `ListModels` 通常是免费操作，但仍需注意

---
