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
            path: '/api/user/credits',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
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
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        
                        // 保存到缓存
                        config[cacheKey] = {
                            data: jsonData,
                            timestamp: currentTime
                        };
                        saveConfig(config);
                        
                        resolve(jsonData);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
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
    
    return '没有指定模型';
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
    const stylePart = `${currentOutputStyle}`;
    const branchPart = currentBranch ? `${currentBranch}(${modifiedFilesCount})` : '';
    const workspacePart = `${currentWorkspace}`;
    
    if (!data) {
        const currentModel = getCurrentModel();
        return `${blue}🍪 需要Cookie(${currentModel})${stylePart}${branchPart}${workspacePart}${reset}`;
    }
    
    try {
        const credits = data.credits || 0;
        const creditLimit = data.creditLimit || 0;
        const plan = data.plan || 'FREE';
        const creditsText = formatCredits(credits);
        const currentModel = getCurrentModel();
        
        return `${blue}积分:${creditsText}/${creditLimit} | 订阅:${plan} | ${currentModel} | ${stylePart} | ${branchPart}${reset}\n${blue}${workspacePart}${reset}`;

        
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
            console.log(`${currentModel} | ${currentUrl}`);
            return;
        }
        
        // 获取有效session和积分数据
        const session = getValidSession();
        let creditsData = null;
        
        if (session) {
            creditsData = await getCredits(session.cookies);
        }
        
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
