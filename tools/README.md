# 🛠️ AICodmirror 工具集

本目录包含用于 AICodmirror 的实用工具脚本，用于管理 Cookie 和查询用量数据。

## 📦 工具列表

### 1. save-cookie.js - Cookie 保存工具
保存 AICodmirror 网站的 Cookie 到配置文件，供其他工具使用。

**使用方法：**
```bash
node tools/save-cookie.js "你的Cookie字符串"
```

**详细步骤：**

1. **获取 Cookie：**
   - 浏览器打开 https://www.aicodemirror.com/dashboard
   - 按 `F12` 打开开发者工具
   - 切换到 `Network` (网络) 标签
   - 刷新页面 (`F5`)
   - 点击任意一个 `www.aicodemirror.com` 域名的请求
   - 在 `Request Headers` 中找到 `Cookie` 字段
   - 复制完整的 Cookie 值

2. **保存 Cookie：**
   ```bash
   node tools/save-cookie.js "Cookie内容"
   ```

3. **验证保存：**
   - 工具会自动运行测试
   - 如果看到 `✅ 测试成功！` 说明保存成功

**注意事项：**
- Cookie 包含空格和特殊字符，必须用引号包裹
- Cookie 有效期通常为几天到几周，过期需重新保存
- 保存的 Cookie 存储在 `aicodemirror-config.json` 文件中

---

### 2. calculate-usage.js - 今日额度使用量计算
计算当日（24小时）的总额度使用量。

**使用方法：**
```bash
node tools/calculate-usage.js
```

**输出示例：**
```
今日日期范围（本地时间）:
  开始: 2025-12-14 00:00:00
  结束: 2025-12-15 00:00:00

接口返回数据条数: 24

  2025-12-14T00:00:00.000Z -> 2025-12-14 08:00:00 consumed: 120
  2025-12-14T01:00:00.000Z -> 2025-12-14 09:00:00 consumed: 350
  ...

今日数据条数: 15
今日 consumed 总和: 1405
今日额度使用量: 1.405
```

**功能特点：**
- 自动计算本地时间的当日范围
- 统计所有小时的消费总和
- 转换为实际额度值（除以 1000）
- 显示详细的逐小时消费明细

---

### 3. daily-usage.js - API Key 用量统计
按不同 API Key 统计今日（24小时）的总额度用量。

**使用方法：**
```bash
node tools/daily-usage.js
```

**输出示例：**
```
═══════════════════════════════════════════════════
          API Key 今日总额度用量统计（24小时）
═══════════════════════════════════════════════════

 1. Claude Code API     1.405
 2. WebApp Key          0.523
 3. Mobile App Key      0.178

───────────────────────────────────────────────────
总计                       2.106
═══════════════════════════════════════════════════
```

**功能特点：**
- 按 API Key 分组统计用量
- 按用量降序排列
- 显示每个 Key 的消费额度
- 计算总计用量

---

## 🔄 工作流程

### 首次使用
```bash
# 步骤 1: 保存 Cookie
node tools/save-cookie.js "你的Cookie"

# 步骤 2: 查询今日用量
node tools/calculate-usage.js

# 步骤 3: 查看各 API Key 用量
node tools/daily-usage.js
```

### Cookie 过期后
当看到 `❌ 未找到 Cookie 配置` 或请求返回 401 错误时：

```bash
# 重新保存 Cookie（其他配置不受影响）
node tools/save-cookie.js "新的Cookie"
```

---

## 📝 技术说明

### 配置文件
所有工具使用统一的配置管理模块 (`config-manager.js`)：
- 配置文件位置：`aicodemirror-config.json`
- Cookie 字段：`cookies`
- 缓存字段：`credits_cache`、`usage_cache`

### 数据安全
- ✅ Cookie 存储在本地配置文件中
- ✅ `.gitignore` 已配置忽略配置文件
- ✅ 不会泄露到版本控制系统
- ⚠️ 请妥善保管配置文件，不要分享给他人

### 错误处理
当工具运行出错时，可能的原因：

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| ❌ 未找到 Cookie 配置 | 未保存 Cookie | 运行 `save-cookie.js` |
| HTTP error! status: 401 | Cookie 已过期 | 重新保存 Cookie |
| 请求失败 | 网络问题 | 检查网络连接 |
| 数据解析错误 | API 返回格式变化 | 联系维护者更新工具 |

---

## 🔧 高级用法

### 定时查询
使用 cron 或 Windows 任务计划定时运行：

**Linux/Mac (crontab):**
```bash
# 每天 23:50 统计当日用量
50 23 * * * cd /path/to/project && node tools/daily-usage.js >> usage.log
```

**Windows (任务计划程序):**
1. 打开任务计划程序
2. 创建基本任务
3. 操作：启动程序
4. 程序：`node`
5. 参数：`tools/daily-usage.js`
6. 起始位置：项目根目录

### 集成到脚本
```bash
#!/bin/bash
# 每日用量报告脚本

echo "正在查询今日用量..."
node tools/calculate-usage.js

echo -e "\n按 API Key 统计:"
node tools/daily-usage.js
```

---

## 📚 相关文件

| 文件 | 说明 |
|------|------|
| `../config-manager.js` | 统一配置管理模块 |
| `../credit-status.js` | 状态栏积分显示脚本 |
| `../display-formatter.js` | 显示格式化模块 |
| `../aicodemirror-config.json` | 配置文件（自动生成）|

---

## ❓ 常见问题

**Q: Cookie 在哪里获取？**
A: 在浏览器开发者工具的 Network 标签中，查看请求头的 Cookie 字段。

**Q: Cookie 多久过期？**
A: 通常几天到几周，具体取决于网站设置。过期后重新保存即可。

**Q: 配置文件在哪里？**
A: 项目根目录的 `aicodemirror-config.json` 文件。

**Q: 可以同时保存多个 Cookie 吗？**
A: 不可以，每次保存会更新当前 Cookie，但不会覆盖其他配置数据。

**Q: 工具报错怎么办？**
A: 检查网络连接和 Cookie 有效性，如仍有问题请查看详细错误信息。

---

## 📄 许可证

本工具集遵循项目主许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新时间：** 2025-12-14
**版本：** v1.0
