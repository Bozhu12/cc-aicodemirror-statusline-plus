# Claude Code 状态栏增强插件 v2.0

这是一个用于 Claude Code 的状态栏增强插件，可以在状态栏显示 aicodemirror.com 的余额、实时使用量、计划类型、当前模型、Git 分支状态等信息。

## ✨ 功能特性

- 💎 **余额显示**：实时显示 aicodemirror.com 余额和计划类型
- 📊 **使用量监控** ：显示最近1小时的实时使用量，精确掌握消费情况
- 🤖 **模型信息**：显示当前使用的 Claude 模型版本
- 🎨 **输出风格**：显示当前 Claude 输出风格配置
- 🌿 **Git 集成**：显示当前分支和修改文件数量
- 📁 **工作区路径**：显示当前工作目录
- 🔄 **自动刷新**：支持会话结束时自动刷新缓存
- 🚨 **动态颜色预警**：API请求失败时自动切换为红色警告，直观提示Cookie过期或网络异常

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
# 进入项目目录
cd ~/.claude/cc-aicodemirror-statusline-plus

# 保存 Cookie（替换为你的实际 Cookie 值）
node save-cookie.js "你的Cookie字符串"
```

成功保存后会显示：
```
✅ Cookie已保存
📏 Cookie长度: xxxx 字符

🧪 正在测试...
✅ 测试成功！信息已获取
🎉 现在重启 Claude Code 即可看到状态栏显示
```

### 4. 重启 Claude Code

保存配置后，重启 Claude Code 即可在状态栏看到实时信息。

## 📊 状态栏显示格式示例

### 正常状态
```
👑 924.87/13.36 (auto) | main(2) | C:\Users\Bozhu12\.claude\cc-aicodemirror-statusline-plus
```

```js
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}/${usageDisplay} ¥ (${currentModel})`,
    stylePart,
    branchPart,
    workspacePart
]);
```

**格式说明：**

- `👑` - 订阅计划图标（👑=ULTRA, 💎=MAX, ⭐=PRO, 🆓=FREE）
- `924.87` - 当前总余额（保留两位小数）
- `13.36` - 最近1小时实时使用量（保留两位小数）
- `¥` - 单位标识
- `(auto)` - 当前模型（haiku/sonnet/opus/auto）
- `main(2)` - Git 分支名(修改文件数)
- 路径部分 - 当前工作目录

### 警告状态

当API请求失败时，整个状态栏文字会变为红色加粗显示，提醒你检查Cookie或网络连接。

**颜色状态：**

- 🟣 **紫色** (#BD93F9)：正常运行，API请求成功
- 🔴 **红色加粗**：警告状态，API请求失败（Cookie过期/网络异常）


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
  "credits_cache": {
    "data": {
      "user": {
        "id": "1001489",
        "email": null,
        "plan": "ULTRA",
        "status": "ACTIVE",
        "createdAt": "2025-07-16T01:10:36.289Z",
        "updatedAt": "2025-12-07T13:28:41.135Z",
        "credits": 924784
      }
    },
    "timestamp": 1765165798.785
  },
  "usage_cache": {
    "data": {
      "hour": "2025-12-08T03:00:00.000Z",
      "consumed": 13436,
      "added": 0
    },
    "timestamp": 1765165798.845
  }
}
```

**基础配置字段：**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cookies` | string | - | aicodemirror.com 的认证 Cookie<br/>⚠️ 包含敏感信息，不要分享 |

**缓存数据 (v2.0 更新)：**

此部分由插件自动管理，无需手动编辑。缓存有效期为 30 秒。

**credits_cache** - 用户信息：
- **user.plan** (string): 用户订阅计划
  - 可能值: `ULTRA`, `MAX`, `PRO`, `FREE`
  - 对应图标: 👑, 💎, ⭐, 🆓
- **user.credits** (number): 当前总余额（单位：千分之一，需除以1000）
- **user.status** (string): 账户状态
- **user.id** (string): 用户ID

**usage_cache** - 使用量监控 ****：
- **hour** (string): 统计时间段（ISO 8601格式）
- **consumed** (number): 该时段消费的额度（单位：千分之一，需除以1000）
- **added** (number): 该时段增加的额度

**手动编辑提示：**

通常你只需要手动编辑 `cookies` 字段，其他字段由插件自动管理，建议不要手动修改。

### 环境变量支持

- `ANTHROPIC_BASE_URL`：API 基础地址，包含 `aicodemirror.com` 时才显示信息
- `ANTHROPIC_MODEL`：当前模型，优先级高于配置文件
- `CLAUDE_OUTPUT_STYLE`：输出风格，优先级高于配置文件

## 🛠️ 工具目录 (tools/)

项目包含一个 `tools/` 目录,集中管理 Cookie 和用量查询工具。详细文档请参考 [tools/README.md](tools/README.md)。

**快速链接：**

| 工具 | 说明 | 使用示例 |
|------|------|---------|
| [save-cookie.js](tools/README.md#1-save-cookiejs---cookie-保存工具) | Cookie 保存工具 | `node tools/save-cookie.js "Cookie"` |
| [calculate-usage.js](tools/README.md#2-calculate-usagejs---今日额度使用量计算) | 今日额度使用量计算 | `node tools/calculate-usage.js` |
| [daily-usage.js](tools/README.md#3-daily-usagejs---api-key-用量统计) | API Key 用量统计 | `node tools/daily-usage.js` |

**特点：**
- ✅ 统一配置管理（自动读取 `aicodemirror-config.json`）
- ✅ Cookie 过期友好提示
- ✅ 详细的数据统计报表
- ✅ 独立的使用文档

## 🛠️ 脚本说明

### credit-status.js
主要状态栏脚本，负责：
- **并发请求优化**: 同时请求两个API接口，提升响应速度
  - `/api/user/profile` - 获取用户信息
  - `/api/user/usage/chart?hours=1` - 获取最近1小时使用量
- **容错机制**: 一个接口成功即视为成功，除非两者都失败
- **智能缓存**: 两个接口分别缓存（`credits_cache` 和 `usage_cache`），有效期30秒
- **并发安全**: 修复了并发写入竞争条件，确保两个缓存都能正确保存
- 检测当前模型和配置
- 调用 display-formatter.js 格式化输出
- 支持调试模式（使用 `--debug` 或 `-d` 参数）

**调试模式**：
```bash
# 测试状态栏显示并查看详细日志
node credit-status.js --debug
```

**v2.0 核心实现**：
```javascript
// 并发执行两个请求
const [credits, usage] = await Promise.all([
    session ? getCredits(session.cookies) : Promise.resolve(null),
    session ? getUsageChart(session.cookies) : Promise.resolve(null)
]);

// 容错逻辑：一个成功就算成功
const hasAnySuccess = credits !== null || usage !== null;

// 根据请求状态动态控制显示颜色
console.log(formatDisplay(!hasAnySuccess));
```

### display-formatter.js (v2.0 更新)
状态栏显示格式化核心模块，负责：
- 格式化状态栏显示信息
- **双缓存读取**: 同时读取 `credits_cache` 和 `usage_cache`
- **实时使用量显示**: 展示最近1小时的消费情况
- **精度优化**: 余额和使用量均保留两位小数（从三位优化）
- 获取当前模型（优先级：环境变量 > settings.json）
- 获取当前输出样式（支持多级配置文件查找）
- 获取 Git 分支和修改文件数
- 提供订阅计划图标映射
- 根据警告状态动态切换显示颜色

**v2.0 数据处理逻辑**：
```javascript
// 从配置中读取两个缓存
const creditsData = config['credits_cache']?.data;
const usageData = config['usage_cache']?.data;

// 余额显示（保留两位小数）
const credits = creditsData.user?.credits || 0;
const creditsDisplay = (credits / 1000).toFixed(2);

// 使用量显示（保留两位小数）
let usageDisplay = '0.00';
if (usageData && typeof usageData.consumed === 'number') {
    usageDisplay = (usageData.consumed / 1000).toFixed(2);
}
```

**动态颜色系统**:
```javascript
// formatDisplay() 接收warning参数
function formatDisplay(warning) {
  const purple = '\x1b[38;2;189;147;249m';  // 正常状态：紫色
  const red = '\x1b[31;1m';                  // 警告状态：红色加粗

  // 根据警告状态动态选择颜色
  return `${warning ? red : purple}${infoParts}${reset}`;
}
```

**状态颜色说明**：
- 🟣 **紫色** (#BD93F9): API请求成功，余额和使用量正常获取
- 🔴 **红色加粗**: API请求失败，Cookie过期或网络异常

### save-cookie.js
Cookie 保存工具，提供：
- 简单的命令行界面
- Cookie 验证测试
- 配置文件管理
- 自动调用 credit-status.js 进行测试验证

## 🎨 自定义状态栏格式

### formatDisplay 函数工作原理

`display-formatter.js` 中的 `formatDisplay()` 函数负责生成状态栏的最终显示文本。该函数在 `credit-status.js` 中被调用：

```javascript
// credit-status.js 调用流程
const [credits, usage] = await Promise.all([...]);
const hasAnySuccess = credits !== null || usage !== null;
console.log(formatDisplay(!hasAnySuccess));  // 传递警告状态参数
```

**参数说明**：
- `warning` (boolean): 控制状态栏颜色
  - `true`: 显示红色（API请求失败）
  - `false`: 显示紫色（正常状态）

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

### 可用的数据字段 (v2.0 更新)

在 `formatDisplay()` 函数中，你可以使用以下数据：

#### 从 credits_cache 获取的数据：
```javascript
const creditsData = config['credits_cache']?.data;

const plan = creditsData.user?.plan || 'FREE';    // ULTRA/MAX/PRO/FREE
const credits = creditsData.user?.credits || 0;    // 总余额（需除以1000）
const userId = creditsData.user?.id;               // 用户ID
const userStatus = creditsData.user?.status;       // 账户状态
```

#### 从 usage_cache 获取的使用量数据 ：
```javascript
const usageData = config['usage_cache']?.data;

const consumed = usageData?.consumed || 0;         // 最近1小时消费（需除以1000）
const added = usageData?.added || 0;               // 最近1小时增加（需除以1000）
const hour = usageData?.hour;                      // 统计时间段
```

#### 订阅计划信息：
```javascript
const planIcon = getPlanIcon(plan); // 👑/💎/⭐/🆓
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
// display-formatter.js 第 75-80 行
// 构建状态栏信息，自动过滤空白部分
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}/${usageDisplay} ¥ (${currentModel})`,
    stylePart,
    branchPart,
    workspacePart
]);

// 返回格式化后的状态栏显示字符串
return `${warning ? red : purple}${infoParts}${reset}`;
```

**输出示例**: `👑 924.87/13.36 ¥ (auto) | main(2) | C:\Users\Bozhu12\.claude\cc-aicodemirror-statusline-plus`

**格式解析**:
- `924.87` - 总余额（保留两位小数）
- `/` - 分隔符
- `13.36` - 最近1小时使用量（保留两位小数）
- `¥` - 单位标识

**智能过滤特性**：使用 `buildSeparatedString()` 辅助方法自动过滤空白部分，当 `stylePart` 或 `branchPart` 为空时，会自动去除对应的 `|` 分隔符。

### 自定义格式示例

#### 示例 1：紧凑版（只显示关键信息）

```javascript
// 修改 display-formatter.js 第 75-83 行为：
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}/${usageDisplay}`,
    currentModel,
    branchPart
]);
return `${warning ? red : purple}${infoParts}${reset}`;
```
**输出**: `👑 924.87/13.36 | auto | main(2)`

#### 示例 2：详细版（包含时间段和消费趋势）

```javascript
// 在第 75 行之前添加时间和趋势计算：
const usageTime = usageData?.hour ? new Date(usageData.hour).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
const usageTrend = usageData && usageData.consumed > 10000 ? '🔥' : '📊';

// 修改第 75-83 行为：
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}`,
    `${usageTrend}${usageDisplay}/h`,
    usageTime,
    currentModel,
    branchPart
]);
return `${warning ? red : purple}${infoParts}${reset}`;
```
**输出**: `👑 924.87 | 🔥13.36/h | 11:00 | auto | main(2)`

#### 示例 3：极简版（仅余额和使用量）

```javascript
// 修改 display-formatter.js 第 75-83 行为：
return `${warning ? red : purple}${creditsDisplay}/${usageDisplay} ${currentModel}${reset}`;
```
**输出**: `924.87/13.36 auto`

#### 示例 4：多彩版（使用不同颜色）

```javascript
// 在 formatDisplay() 函数开头添加更多颜色定义
const blue = '\x1b[34m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

// 修改第 75-83 行为：
const infoParts = buildSeparatedString([
    `${blue}${planIcon} ${green}${creditsDisplay}${reset}/${yellow}${usageDisplay}${reset}`,
    `${cyan}(${currentModel})${reset}`,
    branchPart
]);
return infoParts;  // 注意：颜色已在各部分中设置，无需外层包裹
```
**输出**: `👑 924.87/13.36 (auto) | main(2)` (带颜色)

#### 示例 5：百分比监控版（显示消费百分比）

```javascript
// 在第 75 行之前添加百分比计算：
const usagePercent = credits > 0 ? ((usageData?.consumed || 0) / credits * 100).toFixed(1) : 0;

// 修改第 75-83 行为：
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}`,
    `消费:${usageDisplay}(${usagePercent}%)`,
    currentModel,
    branchPart
]);
return `${warning ? red : purple}${infoParts}${reset}`;
```
**输出**: `👑 924.87 | 消费:13.36(1.4%) | auto | main(2)`

#### 示例 6：自定义分隔符

```javascript
// 修改 display-formatter.js 第 75-83 行为：
// 使用不同的分隔符（如空格或箭头）
const infoParts = buildSeparatedString([
    `${planIcon} ${creditsDisplay}/${usageDisplay}`,
    currentModel,
    branchPart,
    workspacePart
], ' → ');  // 自定义分隔符
return `${warning ? red : purple}${infoParts}${reset}`;
```
**输出**: `👑 924.87/13.36 → auto → main(2) → C:\Users\Bozhu12\.claude\cc-aicodemirror-statusline-plus`

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

2. **找到第 75-83 行**（`formatDisplay()` 函数中构建状态栏信息的部分）

3. **替换为你的自定义格式**
   - 可以直接修改 `buildSeparatedString()` 中的数组元素
   - 也可以完全替换为自己的格式化逻辑
   - v2.0 提供了 `creditsDisplay` 和 `usageDisplay` 两个核心数据

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
// 在第 75 行之前添加自定义计算
const usagePercent = credits > 0 ? ((usageData?.consumed || 0) / credits * 100).toFixed(1) : 0; // 使用率
const avgUsagePerMin = usageData ? (usageData.consumed / 1000 / 60).toFixed(3) : 0; // 平均每分钟消费
const timeInfo = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); // 当前时间
const planEmoji = plan === 'ULTRA' ? '👑' : plan === 'MAX' ? '💎' : plan === 'PRO' ? '⭐' : '🆓';

// 使用这些新字段
const infoParts = buildSeparatedString([
    `${planEmoji} ${creditsDisplay}`,
    `消费:${usageDisplay}(${usagePercent}%)`,
    `${avgUsagePerMin}/min`,
    currentModel,
    timeInfo
]);
return `${warning ? red : purple}${infoParts}${reset}`;
```
**输出**: `👑 924.87 | 消费:13.36(1.4%) | 0.223/min | auto | 11:30`

## 📦 项目结构

```
cc-aicodemirror-statusline-plus/
├── tools/                          # 工具集目录
│   ├── README.md                  # 工具使用文档
│   ├── save-cookie.js             # Cookie 保存工具
│   ├── calculate-usage.js         # 今日额度使用量计算
│   └── daily-usage.js             # API Key 用量统计
├── config-manager.js              # 统一配置管理模块
├── credit-status.js               # 状态栏积分显示脚本
├── display-formatter.js           # 显示格式化模块
├── aicodemirror-config.json       # 配置文件（自动生成）
├── aicodemirror-config.example.json # 配置模板文件
├── README.md                      # 项目主文档
└── .gitignore                     # Git 忽略配置
```

### 条件格式化

你可以根据余额和使用量使用不同的显示样式：

```javascript
// 在第 75 行之前，根据剩余余额和使用量选择颜色
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

// 余额颜色判断
let creditColor = green;  // 充足
if (credits < 500000) creditColor = yellow;  // 警告（500）
if (credits < 100000) creditColor = red;     // 危险（100）

// 使用量颜色判断（根据消费速度）
let usageColor = green;  // 正常
const usageValue = usageData?.consumed || 0;
if (usageValue > 10000) usageColor = yellow;  // 中度使用（10/小时）
if (usageValue > 50000) usageColor = red;     // 高度使用（50/小时）

// 使用条件颜色
const infoParts = buildSeparatedString([
    `${planIcon} ${creditColor}${creditsDisplay}${reset}/${usageColor}${usageDisplay}${reset}`,
    currentModel,
    branchPart
]);
return infoParts;
```
**效果**: 余额不足或使用量过高时，对应数字会变色提醒

### 调试技巧

在修改过程中，可以使用 `console.error()` 输出调试信息（不会影响状态栏显示）：

```javascript
console.error('调试信息 - 总余额:', creditsDisplay);
console.error('调试信息 - 使用量:', usageDisplay);
```

然后运行：
```bash
node credit-status.js 2> debug.log  # 调试信息会写入 debug.log
```

## 🔍 故障排除

### 1. 状态栏不显示信息

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

### 2. 显示"🔴 数据解析失败"

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
curl -H "Cookie: 你的Cookie" https://www.aicodemirror.com/api/user/profile

# 重新获取Cookie
node save-cookie.js "新Cookie"
```

### 3. 状态栏文字显示红色

**现象：** 整个状态栏内容变为红色加粗显示

**原因：** API请求失败，可能是：
- Cookie已过期或无效
- 网络连接中断
- aicodemirror.com服务异常

**解决方法：**
1. **检查Cookie有效性**
   ```bash
   # 重新获取并保存Cookie
   node save-cookie.js "新的Cookie字符串"
   ```

2. **测试网络连接**
   ```bash
   # 测试能否访问目标网站
   curl https://www.aicodemirror.com/api/user/profile
   ```

3. **使用调试模式定位问题**
   ```bash
   node credit-status.js --debug
   # 查看详细的错误信息和响应状态
   ```

4. **检查缓存文件**
   ```bash
   # Windows
   type %USERPROFILE%\.claude\cc-aicodemirror-statusline-plus\aicodemirror-config.json
   
   # Linux/macOS
   cat ~/.claude/cc-aicodemirror-statusline-plus/aicodemirror-config.json
   ```

**颜色状态说明**：
- 🟣 紫色：正常，API请求成功
- 🔴 红色：警告，API请求失败，需要检查Cookie或网络

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
2. **缓存机制**：数据信息会缓存30秒，避免频繁API调用
3. **网络要求**：需要能够访问 aicodemirror.com 的网络环境
4. **版本兼容**：支持 Node.js 14+ 版本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个插件！

## 📄 许可证

MIT License
