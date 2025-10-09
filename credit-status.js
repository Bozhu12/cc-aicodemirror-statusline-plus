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


function consoleLog(...logs) {
  if (false) {
    console.log(...logs);
  }
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
            path: '/dashboard',
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
                    consoleLog(data);
                    if (res.statusCode === 200) {

                        // 检查一下能不能找到initialData
                        const firstCheck = data.includes('initialData');
                        consoleLog("包含 initialData:", firstCheck);
                        // 打印 initialData 之后的1000个字符
                        const index = data.indexOf('initialData');
                        const snippet = data.substring(index, index + 1000);
                        consoleLog("initialData 片段:", snippet);

                        // initialData\":{\"current\":\"256\",\"max\":\"8000\",\"normal\":\"256\",\"bonus\":\"0\",\"plan\":\"PRO\",\"recoveryRate\":\"200\",\"lastRecoveryTimeFormatted\":\"2025-10-09 21:00:00\",\"lastRecoveryTimeRelative\":\"2 分钟前\",\"dailyResets\":1,\"todayResetCount\":1,\"remainingResets\":0,\"canResetToday\":false,\"lastResetAtFormatted\":\"2025-10-09 17:38:16\",\"dailyUsageInfo\":null}
                        //
                        // 正确的正则表达式，注意 \\" 用来匹配 \"
                        const testMatch = snippet.match(/initialData\\":({.*?})/);

                        consoleLog("测试正则匹配结果:", testMatch);

                        if (testMatch && testMatch[1]) {
                            consoleLog("成功提取到的JSON字符串:", testMatch[1]);

                            const correctedString = testMatch[1].replace(/\\"/g, '"');

                            consoleLog("Corrected String:", correctedString);

                            try {
                                // Now, parse the corrected string
                                const dataObject = JSON.parse(correctedString);
                                consoleLog("JSON Parsed Successfully:", dataObject);

                                // 保存到缓存
                                config[cacheKey] = {
                                    data: dataObject,
                                    timestamp: currentTime
                                };
                                saveConfig(config);

                                resolve(dataObject)



                            } catch (e) {
                                consoleLog("JSON Parsing Error:", e);
                                resolve(null);
                            }


                        } else {
                            consoleLog("未匹配到结果。");
                            resolve(null);
                        }

                    } else {
                        consoleLog("非200响应");
                        resolve(null);
                    }
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

function getPlanIcon(plan) {
    const planIcons = {
        'ULTRA': '👑',
        'MAX': '💎',
        'PRO': '⭐',
        'FREE': '🆓'
    };
    return planIcons[plan] || '❓';
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
        if (model.toLowerCase().includes('claude-3')) {
            if (model.toLowerCase().includes('haiku')) {
                return 'Claude 3 Haiku';
            } else if (model.toLowerCase().includes('sonnet')) {
                return 'Claude 3 Sonnet';
            } else if (model.toLowerCase().includes('opus')) {
                return 'Claude 3 Opus';
            }
        } else if (model.toLowerCase().includes('claude-4') || model.toLowerCase().includes('sonnet-4')) {
            return 'Claude 4 Sonnet';
        } else if (model.toLowerCase().includes('opus-4')) {
            return 'Claude 4 Opus';
        } else if (model.length > 20) {
            return model.substring(0, 20) + '...';
        }
        return model;
    }
    
    // 根据当前环境推断默认模型
    const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
    if (baseUrl.includes('aicodemirror.com')) {
        return 'Claude 4 Sonnet';
    }
    return 'Claude (Auto)';
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



function formatDisplay(data) {
    const currentBranch = getCurrentBranch();
    const modifiedFilesCount = getModifiedFilesCount();
    const currentWorkspace = getCurrentWorkspace();
    const currentOutputStyle = getCurrentOutputStyle();
    
    // ANSI颜色代码：蓝色
    const blue = '\x1b[34m';
    const reset = '\x1b[0m';
    
    // 构建基础部分（风格、分支和路径）
    const stylePart = ` | ${currentOutputStyle}`;
    const branchPart = currentBranch ? ` | ${currentBranch}(${modifiedFilesCount})` : '';
    const workspacePart = ` | ${currentWorkspace}`;
    
    if (!data) {
        const currentModel = getCurrentModel();
        return `${blue}🍪 需要Cookie(${currentModel})${stylePart}${branchPart}${workspacePart}${reset}`;
    }
    
    try {
        const credits = data.current || 0;
        const max = data.max || 0;
        const plan = data.plan || 'FREE';
        const canResetToday = data.canResetToday || false;
        const creditsText = formatCredits(credits);
        const planIcon = getPlanIcon(plan);
        const currentModel = getCurrentModel();
        
        return `${blue} 积分:${creditsText}/${max} | 重置:${canResetToday} | 订阅:${plan} | ${currentModel}${stylePart}${branchPart}${workspacePart}${reset}`;
        
    } catch (error) {
        const currentModel = getCurrentModel();
        return `${blue}🔴 数据解析失败(${currentModel})${stylePart}${branchPart}${workspacePart}${reset}`;
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
