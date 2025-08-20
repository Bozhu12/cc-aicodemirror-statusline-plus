# Claude Code 状态栏增强插件

这是一个用于 Claude Code 的状态栏增强插件，可以在状态栏显示 aicodemirror.com 的积分余额、计划类型、当前模型、Git 分支状态等信息。

## ✨ 功能特性

- 💎 **积分显示**：实时显示 aicodemirror.com 积分余额和计划类型
- 🤖 **模型信息**：显示当前使用的 Claude 模型版本
- 🎨 **输出风格**：显示当前 Claude 输出风格配置
- 🌿 **Git 集成**：显示当前分支和修改文件数量
- 📁 **工作区路径**：显示当前工作目录
- ⚡ **智能缓存**：30秒缓存机制，避免频繁API调用
- 🔄 **自动刷新**：支持会话结束时自动刷新积分

## 📦 安装步骤

### 1. 从 GitHub 拉取代码到 .claude 根目录

```bash
# 进入 Claude Code 配置目录
cd ~/.claude

# 从 GitHub 拉取项目代码
git clone https://github.com/your-repo/cc-aicodemirror-statusline-plus.git .
```

### 2. 配置 settings.json

在 `~/.claude/settings.json` 中添加状态栏配置：

#### Windows 系统配置：

```json
{
  "env": {
    "BASH_DEFAULT_TIMEOUT_MS": "600000",
    "BASH_MAX_TIMEOUT_MS": "1800000"
  },
  "model": "opusplan",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"%USERPROFILE%\\.claude\\cc-aicodemirror-statusline-plus\\refresh-credits.js\""
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node \"%USERPROFILE%\\.claude\\cc-aicodemirror-statusline-plus\\credit-status.js\"",
    "padding": 0
  }
}
```

#### Linux/macOS 系统配置：

```json
{
  "env": {
    "BASH_DEFAULT_TIMEOUT_MS": "600000",
    "BASH_MAX_TIMEOUT_MS": "1800000"
  },
  "model": "opusplan",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/cc-aicodemirror-statusline-plus/refresh-credits.js"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-aicodemirror-statusline-plus/credit-status.js",
    "padding": 0
  }
}
```

### 3. 获取并配置 Cookie

#### 步骤 1：登录 aicodemirror.com

1. 打开浏览器，访问 https://www.aicodemirror.com/dashboard
2. 使用你的账号登录

#### 步骤 2：获取 Cookie

1. 按 `F12` 打开开发者工具
2. 切换到 **Network** 标签页
3. 刷新页面 (`F5` 或 `Ctrl+R`)
4. 在网络请求中找到 aicodemirror 任意请求
5. 点击该请求，在右侧面板中找到 **Request Headers**
6. 复制 `Cookie` 字段的完整值

#### 步骤 3：保存 Cookie

```bash
# 进入 .claude 根目录
cd ~/.claude

# 保存 Cookie（替换为你的实际 Cookie 值）
node save-cookie.js "你的Cookie字符串"
```

成功保存后会显示：
```
✅ Cookie已保存到: /path/to/aicodemirror-config.json
📏 Cookie长度: xxxx 字符

🧪 正在测试...
测试结果: 💎 12345(Claude 4 Sonnet) | session-storage | main(2) | /path/to/project
✅ 测试成功！
🎉 现在重启Claude Code即可看到状态栏积分显示
```

### 4. 重启 Claude Code

保存配置后，重启 Claude Code 即可在状态栏看到积分信息。

## 📊 状态栏显示格式

状态栏显示格式：`[计划图标] [积分](模型) | [输出风格] | [分支名](修改文件数) | [工作区路径]`

### 示例显示

```
💎 12345(Claude 4 Sonnet) | session-storage | main(3) | /Users/username/project
```

### 图标说明

| 计划类型 | 图标 | 说明 |
|---------|-----|------|
| ULTRA   | 👑  | 旗舰版 |
| MAX     | 💎  | 最高版 |
| PRO     | ⭐  | 专业版 |
| FREE    | 🆓  | 免费版 |
| 未登录   | 🍪  | 需要Cookie |
| 错误    | 🔴  | 数据异常 |

## 🔧 配置文件说明

### aicodemirror-config.json

插件配置文件，包含 Cookie 和缓存数据：

```json
{
  "cookies": "你的Cookie字符串",
  "credits_cache": {
    "data": {
      "userId": 1001489,
      "email": null,
      "credits": 14661,
      "plan": "MAX"
    },
    "timestamp": 1755704131.115
  }
}
```

### 环境变量支持

- `ANTHROPIC_BASE_URL`：API 基础地址，包含 `aicodemirror.com` 时才显示积分
- `ANTHROPIC_MODEL`：当前模型，优先级高于配置文件
- `CLAUDE_OUTPUT_STYLE`：输出风格，优先级高于配置文件

## 🛠️ 脚本说明

### credit-status.js
主要状态栏脚本，负责：
- 获取积分信息
- 检测当前模型和配置
- 显示 Git 状态
- 格式化输出信息

### save-cookie.js
Cookie 保存工具，提供：
- 简单的命令行界面
- Cookie 验证测试
- 配置文件管理

### refresh-credits.js
积分刷新脚本，用于：
- 会话结束时强制刷新积分缓存
- 静默执行，不影响状态栏显示
- 作为 stopHook 使用

## 🔍 故障排除

### 1. 状态栏不显示积分

**检查项目：**
- 确认 `ANTHROPIC_BASE_URL` 包含 `aicodemirror.com`
- 检查配置文件是否存在：`~/.claude/aicodemirror-config.json`
- 验证 Cookie 是否有效（重新获取）

**解决方法：**
```bash
# 检查配置文件
cat ~/.claude/aicodemirror-config.json

# 重新测试 Cookie
cd ~/.claude
node save-cookie.js "新的Cookie字符串"
```

### 2. 显示"🍪 需要Cookie"

**原因：** Cookie 无效或已过期

**解决方法：**
1. 重新登录 aicodemirror.com
2. 按照上述步骤重新获取 Cookie
3. 使用 `save-cookie.js` 重新保存

### 3. 显示"🔴 数据解析失败"

**可能原因：**
- 网络连接问题
- API 返回格式变化
- Cookie 格式错误

**解决方法：**
```bash
# 手动测试网络连接
curl -H "Cookie: 你的Cookie" https://www.aicodemirror.com/api/user/credits

# 重新获取Cookie
node save-cookie.js "新Cookie"
```

### 4. Git 信息不显示

**原因：** 当前目录不是 Git 仓库

**解决方法：**
```bash
# 检查是否为Git仓库
git status

# 如果需要，初始化Git仓库
git init
```

### 5. 模型信息不准确

**检查优先级：**
1. 环境变量 `ANTHROPIC_MODEL`
2. `~/.claude/settings.json` 中的 `model` 字段
3. 根据 `ANTHROPIC_BASE_URL` 推断

**解决方法：**
```bash
# 检查环境变量
echo $ANTHROPIC_MODEL

# 检查配置文件
cat ~/.claude/settings.json | grep model
```

## 🔄 更新 Cookie

当 Cookie 过期时（通常每隔一段时间），你需要重新获取：

1. 浏览器重新登录 aicodemirror.com
2. 按 F12 -> Network -> 刷新 -> 找到 `/api/user/credits` 请求
3. 复制新的 Cookie 值
4. 运行：`node save-cookie.js "新的Cookie字符串"`
5. 重启 Claude Code

## 📝 注意事项

1. **隐私安全**：Cookie 包含认证信息，请妥善保管，不要分享给他人
2. **缓存机制**：积分信息会缓存30秒，避免频繁API调用
3. **网络要求**：需要能够访问 aicodemirror.com 的网络环境
4. **版本兼容**：支持 Node.js 14+ 版本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个插件！

## 📄 许可证

MIT License