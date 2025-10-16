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
- 🔄 **智能重置**：积分不足时自动触发重置，恢复可用积分

## 📦 安装步骤

### 1. 从 GitHub 拉取代码

#### Windows 系统：
```bash
# 进入 Claude Code 配置目录
cd %USERPROFILE%\.claude

# 从 GitHub 拉取项目代码到子目录
git clone https://github.com/Bozhu12/cc-aicodemirror-statusline-plus.git .
```

#### Linux/macOS 系统：
```bash
# 进入 Claude Code 配置目录
cd ~/.claude

# 从 GitHub 拉取项目代码到子目录
git clone https://github.com/Bozhu12/cc-aicodemirror-statusline-plus.git .
```

### 2. 配置 settings.json

在 `~/.claude/settings.json` 中添加状态栏配置：

#### Windows 系统配置：

```json
{
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
测试结果: 日: 5210/8000(65%) | 周: 38438/38400(100%) | 订阅:PRO | Claude 4 Sonnet
✅ 测试成功！
🎉 现在重启Claude Code即可看到状态栏积分显示
```

### 4. 重启 Claude Code

保存配置后，重启 Claude Code 即可在状态栏看到积分信息。

## 📊 状态栏显示格式示例

```
💎 37288/31167 (sonnet) | default | main(4) | C:\Users\username\project
```

**格式说明：**
- `💎` - 订阅计划图标（👑=ULTRA, 💎=MAX, ⭐=PRO, 🆓=FREE）
- `37288` - 当前可用积分（包含今日可重置的积分）
- `31167` - 本周剩余积分额度
- `(sonnet)` - 当前模型（haiku/sonnet/opus/auto）
- `default` - 当前输出样式
- `simple(4)` - Git 分支名(修改文件数)
- 最后是当前工作目录路径


## 🔧 配置文件说明

### aicodemirror-config.json

插件的主配置文件，包含 Cookie 和缓存数据。

#### 📋 配置模板文件

项目包含一个配置模板文件 `aicodemirror-config.example.json`，你可以复制它来创建自己的配置：

```bash
# Windows
copy aicodemirror-config.example.json aicodemirror-config.json

# Linux/macOS
cp aicodemirror-config.example.json aicodemirror-config.json
```

**⚠️ 重要提示：**
- `aicodemirror-config.json` 包含你的真实 Cookie，**不应该**提交到 Git 仓库
- `aicodemirror-config.example.json` 是模板文件，可以安全提交到 Git
- 项目已在 `.gitignore` 中排除 `aicodemirror-config.json`，确保不会意外泄露

#### 📊 配置文件结构

```json
{
  "cookies": "你的Cookie字符串",
  "creditThreshold": 1000,
  "autoResetEnabled": false,
  "credits_cache": {
    "data": {
      "userPlan": "MAX",
      "creditData": {
        "current": "17288",
        "max": "20000",
        "normal": "17288",
        "bonus": "0",
        "plan": "MAX",
        "recoveryRate": "500",
        "lastRecoveryTimeFormatted": "2025-10-12 14:00:00",
        "dailyResets": 1,
        "todayResetCount": 0,
        "remainingResets": 1,
        "canResetToday": true,
        "lastResetAtFormatted": "2025-10-11 16:06:46"
      },
      "weeklyUsageData": {
        "plan": "MAX",
        "weeklyUsed": 64638,
        "weeklyLimit": 96000,
        "weeklyRemaining": 31362,
        "weeklyUsageResetAt": "2025-10-08 08:00:00",
        "nextResetAt": "2025-10-15 08:00:00",
        "nextResetAtRelative": "3 天内",
        "percentage": 67,
        "isFreeUser": false
      }
    },
    "timestamp": 1760249994.282
  }
}
```

**基础配置字段：**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cookies` | string | - | aicodemirror.com 的认证 Cookie<br/>⚠️ 包含敏感信息，不要分享 |
| `creditThreshold` | number | 1000 | 积分重置触发阈值<br/>建议值：500-2000 |
| `autoResetEnabled` | boolean | false | 是否启用自动积分重置<br/>⚠️ 启用后可能产生费用 |

**缓存数据 (credits_cache)：**

此部分由插件自动管理，无需手动编辑。缓存有效期为 30 秒。

- **userPlan** (string): 用户订阅计划
  - 可能值: `ULTRA`, `MAX`, `PRO`, `FREE`
  - 对应图标: 👑, 💎, ⭐, 🆓

- **creditData** (object): 每日积分详细信息
  - `current`: 当前剩余积分
  - `max`: 每日积分上限
  - `normal`: 常规积分数量
  - `bonus`: 奖励积分数量
  - `weeklyBonus`: 每周奖励积分
  - `plan`: 积分计划类型
  - `recoveryRate`: 积分恢复速率(每小时)
  - `canResetToday`: 今日是否可重置
  - `remainingResets`: 剩余重置次数

- **weeklyUsageData** (object): 每周使用额度数据
  - `weeklyUsed`: 本周已使用积分
  - `weeklyLimit`: 每周积分限额
  - `weeklyRemaining`: 本周剩余积分
  - `percentage`: 已使用百分比
  - `isFreeUser`: 是否为免费用户

**手动编辑提示：**

通常你只需要手动编辑以下字段：
```json
{
  "cookies": "从浏览器获取的Cookie",
  "creditThreshold": 1000,
  "autoResetEnabled": false
}
```
其他字段由插件自动管理，建议不要手动修改。

### 环境变量支持

- `ANTHROPIC_BASE_URL`：API 基础地址，包含 `aicodemirror.com` 时才显示积分
- `ANTHROPIC_MODEL`：当前模型，优先级高于配置文件
- `CLAUDE_OUTPUT_STYLE`：输出风格，优先级高于配置文件

## 💰 积分重置机制

### 工作原理
当 Claude Code 会话结束时，插件会自动检查积分余额。如果积分低于设定阈值，将自动调用 aicodemirror.com 的积分重置接口。

### 触发条件
积分重置**仅在以下条件同时满足时触发**：
1. **功能启用**：`autoResetEnabled` 为 `true`（默认为 false，即关闭状态）
2. **积分不足**：当前积分 < 设定阈值（默认 1000）
3. **会话结束**：Claude Code 停止对话时（Hook Stop 触发）

### 配置管理
```json
{
  "creditThreshold": 1000,      // 触发阈值，可自定义
  "autoResetEnabled": true       // 功能开关，设为 true 启用，false 关闭
}
```

**启用功能**：设置 `autoResetEnabled: true`

**调整阈值**：修改 `creditThreshold` 值，比如设为 `500` 或 `2000`

**禁用功能**：设置 `autoResetEnabled: false`（默认值）

### 安全特性
- **静默执行**：不产生任何输出，不影响状态栏显示
- **错误静默**：网络错误或接口异常不会影响正常使用
- **无重试机制**：避免意外的重复触发
- **即时触发**：检测到条件满足立即执行

### ⚠️ 使用须知
1. **账单影响**：积分重置可能产生费用，请确认你的付费计划
2. **自动执行**：功能启用后会在后台自动运行，无需手动干预
3. **网络依赖**：需要稳定的网络连接访问 aicodemirror.com
4. **Cookie有效性**：确保认证 Cookie 未过期

## 🛠️ 脚本说明

### credit-status.js
主要状态栏脚本，负责：
- 获取积分信息（支持 30 秒缓存机制）
- 检测当前模型和配置
- 调用 display-formatter.js 格式化输出
- 支持调试模式（使用 `--debug` 或 `-d` 参数）

**调试模式**：
```bash
# 测试状态栏显示并查看详细日志
node credit-status.js --debug
```

### display-formatter.js
状态栏显示格式化核心模块，负责：
- 格式化状态栏显示信息
- 获取当前模型（优先级：环境变量 > settings.json）
- 获取当前输出样式（支持多级配置文件查找）
- 获取 Git 分支和修改文件数
- 计算实际可用积分（包含今日可重置的积分）
- 提供订阅计划图标映射

**积分计算逻辑**：
- 如果 `canResetToday` 为 `true`，显示的可用积分 = current + max
- 否则，显示的可用积分 = current

### save-cookie.js
Cookie 保存工具，提供：
- 简单的命令行界面
- Cookie 验证测试
- 配置文件管理
- 自动调用 credit-status.js 进行测试验证

### refresh-credits.js
积分刷新脚本（Stop Hook），用于：
- 会话结束时强制刷新积分缓存
- 积分不足时自动触发重置机制（需启用 autoResetEnabled）
- 静默执行，不影响状态栏显示
- 仅在 ANTHROPIC_BASE_URL 包含 aicodemirror.com 时运行

## 🎨 自定义状态栏格式

### formatDisplay 函数工作原理

`display-formatter.js` 中的 `formatDisplay()` 函数负责生成状态栏的最终显示文本。该函数在 `credit-status.js` 中被调用：

```javascript
// credit-status.js 调用流程
await getCredits(session.cookies);  // 获取并缓存积分数据
console.log(formatDisplay());        // 输出格式化结果到状态栏
```

### buildSeparatedString 辅助方法

`display-formatter.js` 提供了一个辅助方法用于智能构建带分隔符的字符串：

```javascript
/**
 * 构建带分隔符的字符串，自动忽略空白部分
 * @param {Array<string>} parts 需要连接的部分
 * @param {string} separator 分隔符，默认为 ' | '
 * @returns {string} 连接后的字符串
 */
function buildSeparatedString(parts, separator = ' | ')
```

**使用示例**：
```javascript
// 自动过滤空字符串，只在非空部分之间添加分隔符
buildSeparatedString(['A', '', 'C', 'D'])  // 返回: "A | C | D"
buildSeparatedString(['A', 'B'], ' - ')     // 返回: "A - B"
```

### 可用的数据字段

在 `formatDisplay()` 函数中，你可以使用以下数据：

#### 从缓存获取的积分数据 (`data.creditData`)：
```javascript
const dailyCurrent = data.creditData.current || 0;           // 当前剩余积分
const dailyMax = data.creditData.max || 0;                   // 每日积分上限
const canResetToday = data.creditData.canResetToday || false;// 今日是否可重置
const recoveryRate = data.creditData.recoveryRate || 0;      // 积分恢复速率
const remainingResets = data.creditData.remainingResets || 0;// 剩余重置次数
```

#### 从缓存获取的周额度数据 (`data.weeklyUsageData`)：
```javascript
const weeklyUsed = data.weeklyUsageData.weeklyUsed || 0;       // 本周已使用
const weeklyLimit = data.weeklyUsageData.weeklyLimit || 0;     // 每周限额
const weeklyRemaining = data.weeklyUsageData.weeklyRemaining || 0; // 本周剩余
const weeklyPercentage = data.weeklyUsageData.percentage || 0; // 使用百分比
```

#### 订阅计划信息：
```javascript
const plan = data.userPlan || 'FREE';        // ULTRA/MAX/PRO/FREE
const planIcon = getPlanIcon(data.userPlan); // 👑/💎/⭐/🆓
```

#### 辅助函数获取的信息：
```javascript
const currentModel = getCurrentModel();           // haiku/sonnet/opus/auto
const currentOutputStyle = getCurrentOutputStyle(); // 输出样式名称
const currentBranch = getCurrentBranch();         // Git 分支名
const modifiedFilesCount = getModifiedFilesCount(); // 修改文件数
const currentWorkspace = getCurrentWorkspace();   // 当前工作目录
```

### 当前默认格式

```javascript
// display-formatter.js 第 88-97 行
// 构建状态栏信息，自动过滤空白部分
const infoParts = buildSeparatedString([
    `${planIcon} ${realDailyCurrent}/${weeklyLimit-weeklyUsed} (${currentModel})`,
    stylePart,
    branchPart,
    workspacePart
]);

// 返回格式化后的状态栏显示字符串
return `${blue}${infoParts}${reset}`;
```

**输出示例**: `💎 37288/31167 (sonnet) | default | main(4) | C:\Users\username\project`

**智能过滤特性**：使用 `buildSeparatedString()` 辅助方法自动过滤空白部分，当 `stylePart` 或 `branchPart` 为空时，会自动去除对应的 `|` 分隔符。

### 自定义格式示例

#### 示例 1：紧凑版（只显示关键信息）

```javascript
// 修改 display-formatter.js 第 88-97 行为：
const infoParts = buildSeparatedString([
    `${planIcon} ${realDailyCurrent}`,
    currentModel,
    branchPart
]);
return `${blue}${infoParts}${reset}`;
```
**输出**: `💎 37288 | sonnet | main(4)`

#### 示例 2：详细版（包含百分比和周剩余）

```javascript
// 在第 88 行之前添加百分比计算：
const dailyPercent = dailyMax > 0 ? Math.round((realDailyCurrent / (dailyMax * (canResetToday ? 2 : 1))) * 100) : 0;

// 修改第 88-97 行为：
const infoParts = buildSeparatedString([
    `${planIcon} 日:${dailyPercent}%`,
    `周:${weeklyRemaining}/${weeklyLimit}`,
    currentModel,
    branchPart,
    workspacePart
]);
return `${blue}${infoParts}${reset}`;
```
**输出**: `💎 日:93% | 周:31167/96000 | sonnet | main(4) | C:\Users\username\project`

#### 示例 3：极简版（仅积分和模型）

```javascript
// 修改 display-formatter.js 第 88-97 行为：
return `${blue}${realDailyCurrent}/${weeklyRemaining} ${currentModel}${reset}`;
```
**输出**: `37288/31167 sonnet`

#### 示例 4：多彩版（使用不同颜色）

```javascript
// 在 formatDisplay() 函数开头添加更多颜色定义
const blue = '\x1b[34m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

// 修改第 88-97 行为：
const infoParts = buildSeparatedString([
    `${blue}${planIcon} ${green}${realDailyCurrent}${reset}/${yellow}${weeklyRemaining}${reset}`,
    `${cyan}(${currentModel})${reset}`,
    branchPart
]);
return infoParts;  // 注意：颜色已在各部分中设置，无需外层包裹
```
**输出**: `💎 37288/31167 (sonnet) | main(4)` (带颜色)

#### 示例 5：自定义分隔符

```javascript
// 修改 display-formatter.js 第 88-97 行为：
// 使用不同的分隔符（如空格或箭头）
const infoParts = buildSeparatedString([
    `${planIcon} ${realDailyCurrent}/${weeklyRemaining}`,
    currentModel,
    branchPart,
    workspacePart
], ' → ');  // 自定义分隔符
return `${blue}${infoParts}${reset}`;
```
**输出**: `💎 37288/31167 → sonnet → main(4) → C:\Users\username\project`

### ANSI 颜色代码参考

```javascript
// 文字颜色
const black   = '\x1b[30m';
const red     = '\x1b[31m';
const green   = '\x1b[32m';
const yellow  = '\x1b[33m';
const blue    = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan    = '\x1b[36m';
const white   = '\x1b[37m';

// 背景颜色
const bgRed   = '\x1b[41m';
const bgGreen = '\x1b[42m';

// 样式
const bold    = '\x1b[1m';
const dim     = '\x1b[2m';
const reset   = '\x1b[0m'; // 重置所有样式
```

### 修改步骤

1. **编辑文件**：
   ```bash
   # Windows
   notepad %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus\display-formatter.js

   # Linux/macOS
   nano ~/.claude/cc-aicodemirror-statusline-plus/display-formatter.js
   ```

2. **找到第 88-97 行**（`formatDisplay()` 函数中构建状态栏信息的部分）

3. **替换为你的自定义格式**
   - 可以直接修改 `buildSeparatedString()` 中的数组元素
   - 也可以完全替换为自己的格式化逻辑

4. **测试修改**：
   ```bash
   # Windows
   cd %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus
   node credit-status.js

   # Linux/macOS
   cd ~/.claude/cc-aicodemirror-statusline-plus
   node credit-status.js
   ```

5. **查看实时效果**：重启 Claude Code 或等待状态栏刷新

### 高级自定义：添加新字段

如果你想添加更多信息，可以在 `formatDisplay()` 函数中计算新的值：

```javascript
// 在第 88 行之前添加自定义计算
const dailyUsed = dailyMax - dailyCurrent;                    // 今日已用
const dailyUsedPercent = Math.round((dailyUsed / dailyMax) * 100); // 今日使用率
const resetInfo = canResetToday ? '🔄' : '';                   // 可重置标记
const timeInfo = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); // 当前时间

// 使用这些新字段
const infoParts = buildSeparatedString([
    `${planIcon}${resetInfo} ${realDailyCurrent} (用${dailyUsedPercent}%)`,
    currentModel,
    timeInfo
]);
return `${blue}${infoParts}${reset}`;
```
**输出**: `💎🔄 37288 (用7%) | sonnet | 14:30`

### 条件格式化

你可以根据积分余量使用不同的显示样式：

```javascript
// 在第 88 行之前，根据剩余积分选择颜色
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

let creditColor = green;  // 充足
if (realDailyCurrent < 5000) creditColor = yellow;  // 警告
if (realDailyCurrent < 2000) creditColor = red;     // 危险

// 使用条件颜色
const infoParts = buildSeparatedString([
    `${creditColor}${planIcon} ${realDailyCurrent}${reset}/${weeklyRemaining}`,
    currentModel,
    branchPart
]);
return infoParts;
```

### 调试技巧

在修改过程中，可以使用 `console.error()` 输出调试信息（不会影响状态栏显示）：

```javascript
console.error('调试信息 - 当前积分:', realDailyCurrent);
console.error('调试信息 - 周剩余:', weeklyRemaining);
```

然后运行：
```bash
node credit-status.js 2> debug.log  # 调试信息会写入 debug.log
```

## 🔍 故障排除

### 1. 状态栏不显示积分

**检查项目：**
- 确认 `ANTHROPIC_BASE_URL` 包含 `aicodemirror.com`
- 检查配置文件是否存在
- 验证 Cookie 是否有效（重新获取）

**解决方法：**

**Windows 系统：**
```bash
# 检查配置文件
type %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus\aicodemirror-config.json

# 重新测试 Cookie
cd %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus
node save-cookie.js "新的Cookie字符串"
```

**Linux/macOS 系统：**
```bash
# 检查配置文件
cat ~/.claude/cc-aicodemirror-statusline-plus/aicodemirror-config.json

# 重新测试 Cookie
cd ~/.claude/cc-aicodemirror-statusline-plus
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
# 使用调试模式查看详细错误信息
cd %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus    # Windows
cd ~/.claude/cc-aicodemirror-statusline-plus                 # Linux/macOS
node credit-status.js --debug

# 手动测试网络连接
curl -H "Cookie: 你的Cookie" https://www.aicodemirror.com/dashboard/credit-packs

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
3. 默认显示 `auto`

**解决方法：**

**Windows 系统：**
```bash
# 检查环境变量
echo %ANTHROPIC_MODEL%

# 检查配置文件
type %USERPROFILE%\.claude\settings.json | findstr model
```

**Linux/macOS 系统：**
```bash
# 检查环境变量
echo $ANTHROPIC_MODEL

# 检查配置文件
cat ~/.claude/settings.json | grep model
```

## 📝 注意事项

1. **隐私安全**：Cookie 包含认证信息，请妥善保管，不要分享给他人
2. **缓存机制**：积分信息会缓存30秒，避免频繁API调用
3. **网络要求**：需要能够访问 aicodemirror.com 的网络环境
4. **版本兼容**：支持 Node.js 14+ 版本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个插件！

## 📄 许可证

MIT License
