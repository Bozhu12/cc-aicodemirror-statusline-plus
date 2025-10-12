#!/usr/bin/env node
/**
 * Claude Code 积分状态栏脚本
 * 用途: 在状态栏显示 aicodemirror.com 的积分余额
 * 版本: v1.3 (Node.js)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { formatDisplay, getCurrentModel } = require('./display-formatter');

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
        if (!fs.existsSync(CONFIG_FILE)) return {};
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
            timeout: 5000
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

function getValidSession() {
    const config = loadConfig();
    return config.cookies ? { cookies: config.cookies } : null;
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

        const session = getValidSession();
        if (session) await getCredits(session.cookies);

        // 格式化并输出状态
        console.log(formatDisplay());

    } catch (error) {
        // 即使出错也显示基本信息
        const currentUrl = getDisplayUrl();
        console.log(`🔴 错误 | ${currentUrl}`);
    }
}

if (require.main === module) {
    main();
}
