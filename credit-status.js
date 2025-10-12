#!/usr/bin/env node
/**
 * Claude Code 积分状态栏脚本
 * 用途: 在状态栏显示 aicodemirror.com 的积分余额
 * 版本: v1.3 (Node.js)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 缓存配置 - 30秒缓存，避免频繁API调用
const CACHE_DURATION = 30; // 秒

// 配置文件路径 - 优先使用相对路径
const CONFIG_FILE = path.join(__dirname, 'aicodemirror-config.json');

// 禁用SSL证书验证警告
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 检查是否开启调试模式
// node credit-status.js -d
const DEBUG_MODE = process.argv.includes('--debug') || process.argv.includes('-d') || process.env.DEBUG === 'true';

function consoleLog(...logs) {
  if (DEBUG_MODE) {
    console.log(...logs);
  }
}


function findMatchingRightBrace(src, start = 0) {
  if (typeof src !== 'string') return -1;

  // 找到起始的 '{'
  let braceStart = -1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { braceStart = i; break; }
    // 如果你保证文本第一个字符就是 '{'，也可以直接：braceStart = start;
  }
  if (braceStart === -1) return -1;

  let depth = 0;
  let inString = false;

  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];

    if (ch === '"') {
      // 统计左侧连续反斜杠数量，奇数 => 本引号被转义
      let bs = 0;
      for (let k = i - 1; k >= 0 && src[k] === '\\'; k--) bs++;
      const escaped = (bs % 2 === 1);
      if (!escaped) inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) return i; // 找到与首个 '{' 匹配的 '}'
      }
    }
  }

  return -1; // 未闭合
}

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return {};
        }
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveConfig(config) {
    try {
        const configDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        // 忽略错误
    }
}

function getCredits(cookies) {
    return new Promise((resolve) => {
        if (!cookies) {
            resolve(null);
            return;
        }

        // 检查缓存
        const config = loadConfig();
        const cacheKey = 'credits_cache';
        const currentTime = Date.now() / 1000;

        // 如果有缓存且未过期，直接返回缓存数据
        if (config[cacheKey]) {
            const cacheData = config[cacheKey];
            if (currentTime - (cacheData.timestamp || 0) < CACHE_DURATION) {
                resolve(cacheData.data);
                return;
            }
        }

        const options = {
            hostname: 'www.aicodemirror.com',
            path: '/dashboard/credit-packs',
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 3000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    consoleLog("-----------", res.statusCode, "-----------");
                    // consoleLog(data);
                    if (res.statusCode !== 200) throw new Error(`非200响应: ${res.statusCode}`);

                    // 获取creditPacks
                    const firstCheck = data.includes('creditPacks');
                    consoleLog("包含 creditPacks:", firstCheck);
                    if (firstCheck === false) throw new Error("获取 creditPacks 失败");
                    const index = data.indexOf('creditPacks');
                    const snippet = data.substring(index-3, index + 10000);
                    consoleLog("片段:", snippet);


                    const endIdx = findMatchingRightBrace(snippet);
                    const matchText = snippet.substring(0, endIdx + 1);
                    consoleLog("匹配文本:", matchText);

                    const correctedString = matchText.replace(/\\"/g, '"');
                    // consoleLog("Corrected String:", correctedString);

                    // Now, parse the corrected string
                    const dataObject = JSON.parse(correctedString);
                    // consoleLog("JSON Parsed Successfully:", dataObject);

                    // 过滤掉 creditPacks 数组以减少缓存大小，避免空指针
                    const { creditPacks, ...filteredData } = dataObject || {};
                    consoleLog("Filtered Data (creditPacks removed):", filteredData);

                    // 保存到缓存（使用过滤后的数据）
                    config[cacheKey] = {
                        data: filteredData,
                        timestamp: currentTime
                    };
                    saveConfig(config);

                    resolve(filteredData)


                } catch (error) {
                    consoleLog("Error processing response:", error);
                    resolve(null);
                }
            });
        });

        req.on('error', () => {
            resolve(null);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });

        req.end();
    });
}


function formatCredits(credits) {
    return credits.toString();
}


function getDisplayUrl() {
    const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
    if (baseUrl) {
        if (baseUrl.includes('aicodemirror.com')) {
            return 'aicodemirror.com';
        } else {
            const match = baseUrl.match(/https?:\/\/([^\/]+)/);
            if (match) {
                return match[1];
            }
        }
    }
    return 'anthropic.com';
}

function getCurrentModel() {
    // 优先使用环境变量
    let model = process.env.ANTHROPIC_MODEL || '';

    // 如果环境变量没有，检查settings.json
    if (!model) {
        try {
            const settingsFile = path.join(os.homedir(), '.claude', 'settings.json');
            if (fs.existsSync(settingsFile)) {
                const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
                model = settings.model || '';
            }
        } catch (error) {
            // 忽略错误
        }
    }

    if (model) {
        if (model.toLowerCase().includes('haiku')) {
            return 'haiku';
        } else if (model.toLowerCase().includes('sonnet')) {
            return 'sonnet';
        } else if (model.toLowerCase().includes('opus')) {
            return 'opus';
        }
    }

    return 'auto';
}

function getCurrentOutputStyle() {
    try {
        // 优先检查环境变量
        if (process.env.CLAUDE_OUTPUT_STYLE) {
            return process.env.CLAUDE_OUTPUT_STYLE;
        }

        // 检查多个可能的配置文件位置 (按优先级排序)
        const configPaths = [
            // 1. 当前工作区的 settings.local.json (优先级最高)
            path.join(process.cwd(), '.claude', 'settings.local.json'),
            // 2. 用户根目录的 settings.local.json
            path.join(os.homedir(), '.claude', 'settings.local.json'),
            // 3. 当前工作区的 settings.json
            path.join(process.cwd(), '.claude', 'settings.json'),
            // 4. 用户根目录的 settings.json (兜底)
            path.join(os.homedir(), '.claude', 'settings.json')
        ];

        for (const configPath of configPaths) {
            if (fs.existsSync(configPath)) {
                const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (settings.outputStyle) {
                    return settings.outputStyle;
                }
            }
        }

        return 'default';

    } catch (error) {
        // 忽略错误
    }
    return 'default';
}

function getCurrentBranch() {
    try {
        const { execSync } = require('child_process');
        const branch = execSync('git branch --show-current', {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 2000
        }).trim();
        return branch || null;
    } catch (error) {
        return null;
    }
}

function getModifiedFilesCount() {
    try {
        const { execSync } = require('child_process');

        // 使用 git status --porcelain 来获取工作区状态
        const statusOutput = execSync('git status --porcelain', {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 2000
        }).trim();

        if (!statusOutput) {
            return 0;
        }

        // 计算有变化的文件数量（排除空行）
        const files = statusOutput.split('\n').filter(line => line.trim());
        return files.length;
    } catch (error) {
        return 0;
    }
}

function getCurrentWorkspace() {
    try {
        return process.cwd();
    } catch (error) {
        return 'unknown';
    }
}

function getPlanIcon(plan) {
    const planIcons = {
        'ULTRA': '👑',
        'MAX': '💎',
        'PRO': '⭐',
        'FREE': '🆓'
    };
    return planIcons[plan] || '❓';
}

function formatDisplay(data) {
    if (!data) {
        const currentModel = getCurrentModel();
        return `${blue}🍪 需要Cookie`;
    }

    // ANSI颜色代码：蓝色
    const blue = '\x1b[34m';
    const reset = '\x1b[0m';

    const currentBranch = getCurrentBranch();
    const modifiedFilesCount = getModifiedFilesCount();
    const currentWorkspace = getCurrentWorkspace();
    const currentOutputStyle = getCurrentOutputStyle();
    
    try {

        // 构建基础部分（风格、分支和路径）
        const stylePart = `${currentOutputStyle}`;
        const branchPart = currentBranch ? `${currentBranch}(${modifiedFilesCount})` : '';
        const workspacePart = `${currentWorkspace}`;

        const dailyCurrent = data.creditData.current || 0;
        const dailyMax = data.creditData.max || 0;
        const dailyPercentage = dailyMax > 0 ? Math.min(100, Math.max(0, Math.round((dailyCurrent / dailyMax) * 100))): 0;
        const weeklyUsed = data.weeklyUsageData.weeklyUsed || 0;
        const weeklyLimit = data.weeklyUsageData.weeklyLimit || 0;
        const weeklyPercentage = weeklyLimit > 0 ? Math.min(100, Math.max(0, Math.round((weeklyUsed / weeklyLimit) * 100))) : 0;
        const plan = data.userPlan || 'FREE';
        const planIcon = getPlanIcon(data.userPlan);
        const canResetToday = data.creditData.canResetToday || false;
        const currentModel = getCurrentModel();

        return `${blue}${planIcon} ${dailyCurrent}/${weeklyLimit-weeklyUsed} (${currentModel}) | ${stylePart} | ${branchPart} | ${workspacePart}${reset}`;
    } catch (error) {
        const currentModel = getCurrentModel();
        return `${blue}🔴 数据解析失败`;
    }
}

function getValidSession() {
    const config = loadConfig();

    if (config.cookies) {
        return { cookies: config.cookies };
    }

    return null;
}

function checkAnthropicBaseUrl() {
    const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
    return baseUrl.includes('aicodemirror.com');
}

async function main() {
    try {
        // 检查是否使用aicodemirror
        if (!checkAnthropicBaseUrl()) {
            const currentUrl = getDisplayUrl();
            const currentModel = getCurrentModel();
            consoleLog(`${currentModel} | ${currentUrl}`);
            return;
        }

        // 获取有效session和积分数据
        const session = getValidSession();
        let creditsData = null;
        consoleLog("获取有效session和积分数据")

        if (session) {
            creditsData = await getCredits(session.cookies);
        }
        consoleLog("获取积分数据完成")
        consoleLog(creditsData)

        // 格式化并输出状态
        const statusText = formatDisplay(creditsData);
        console.log(statusText);

    } catch (error) {
        // 即使出错也显示基本信息
        const currentUrl = getDisplayUrl();
        const currentModel = getCurrentModel();
        console.log(`🔴 错误 | ${currentModel} | ${currentUrl}`);
    }
}

if (require.main === module) {
    main();
}
