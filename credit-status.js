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
                    consoleLog("响应内容长度:", data.length);
                    // consoleLog("响应内容前1000字符:", data.substring(0, 1000));

                    if (res.statusCode !== 200) throw new Error(`非200响应: ${res.statusCode}`);

                    // 新的解析逻辑 - 查找包含所有必需字段的JSON对象
                    // 必须同时包含 userPlan, creditData, weeklyUsageData
                    const hasAllFields = data.includes('userPlan') &&
                                        data.includes('creditData') &&
                                        data.includes('weeklyUsageData');

                    consoleLog("包含所有必需字段:", hasAllFields);

                    if (!hasAllFields) {
                        throw new Error("响应中缺少必需字段 - 网站结构可能已改变");
                    }

                    // 新策略: 先找到同时包含三个字段的文本区域
                    // 找到这三个字段中第一个和最后一个出现的位置
                    const positions = {
                        userPlan: data.indexOf('userPlan'),
                        creditData: data.indexOf('creditData'),
                        weeklyUsageData: data.indexOf('weeklyUsageData')
                    };

                    const minPos = Math.min(...Object.values(positions));
                    const maxPos = Math.max(...Object.values(positions));

                    consoleLog("字段位置:", positions);
                    consoleLog("区域范围:", minPos, "-", maxPos);

                    // 新策略:直接构造包含三个字段的JSON对象
                    // 提取每个字段的值
                    const extractFieldValue = (fieldName, startPos) => {
                        // 找到字段名后的 :
                        let colonPos = startPos;
                        while (colonPos < data.length && data[colonPos] !== ':') {
                            colonPos++;
                        }
                        if (colonPos >= data.length) {
                            consoleLog(`未找到字段 ${fieldName} 的冒号`);
                            return null;
                        }

                        // 从 : 后开始,找到值的起始
                        let valueStart = colonPos + 1;
                        while (valueStart < data.length && (data[valueStart] === ' ' || data[valueStart] === '\n' || data[valueStart] === '\t')) {
                            valueStart++;
                        }

                        consoleLog(`字段 ${fieldName} 值起始字符:`, data[valueStart], `位置:`, valueStart);

                        // 判断值的类型并提取
                        if (data[valueStart] === '{') {
                            // 对象类型
                            const snippet = data.substring(valueStart);
                            const endIdx = findMatchingRightBrace(snippet);
                            if (endIdx === -1) {
                                consoleLog(`字段 ${fieldName} 对象未找到闭合符`);
                                return null;
                            }
                            return data.substring(valueStart, valueStart + endIdx + 1);
                        } else if (data[valueStart] === '"') {
                            // 字符串类型,需要处理转义引号
                            let endQuote = valueStart + 1;
                            while (endQuote < data.length) {
                                if (data[endQuote] === '"' && data[endQuote - 1] !== '\\') {
                                    break;
                                }
                                endQuote++;
                            }
                            if (endQuote >= data.length) {
                                consoleLog(`字段 ${fieldName} 字符串未找到结束引号`);
                                return null;
                            }
                            return data.substring(valueStart, endQuote + 1);
                        } else if (data[valueStart] === '[') {
                            // 数组类型(虽然我们不需要,但为了完整性)
                            let depth = 0;
                            let endPos = valueStart;
                            while (endPos < data.length) {
                                if (data[endPos] === '[') depth++;
                                if (data[endPos] === ']') {
                                    depth--;
                                    if (depth === 0) break;
                                }
                                endPos++;
                            }
                            return data.substring(valueStart, endPos + 1);
                        } else {
                            // 其他类型(数字,布尔,null等),找到下一个逗号或}
                            let endPos = valueStart;
                            while (endPos < data.length && data[endPos] !== ',' && data[endPos] !== '}' && data[endPos] !== ']') {
                                endPos++;
                            }
                            return data.substring(valueStart, endPos).trim();
                        }
                    };

                    const userPlanValue = extractFieldValue('userPlan', positions.userPlan);
                    const creditDataValue = extractFieldValue('creditData', positions.creditData);
                    const weeklyUsageDataValue = extractFieldValue('weeklyUsageData', positions.weeklyUsageData);

                    consoleLog("提取的userPlan:", userPlanValue);
                    consoleLog("提取的creditData长度:", creditDataValue ? creditDataValue.length : 0);
                    consoleLog("提取的weeklyUsageData长度:", weeklyUsageDataValue ? weeklyUsageDataValue.length : 0);

                    if (!userPlanValue || !creditDataValue || !weeklyUsageDataValue) {
                        throw new Error("无法提取所有必需字段的值");
                    }

                    // 手动构造JSON字符串
                    const constructedJson = `{
                        "userPlan": ${userPlanValue},
                        "creditData": ${creditDataValue},
                        "weeklyUsageData": ${weeklyUsageDataValue}
                    }`;

                    consoleLog("构造的JSON前200字符:", constructedJson.substring(0, 200));

                    // 处理转义字符并解析
                    const correctedString = constructedJson.replace(/\\"/g, '"');
                    let dataObject;

                    try {
                        dataObject = JSON.parse(correctedString);
                        consoleLog("JSON解析成功");
                        consoleLog("对象字段:", Object.keys(dataObject));
                    } catch (e) {
                        consoleLog("解析失败,尝试原始字符串...");
                        consoleLog("错误:", e.message);
                        throw new Error(`JSON解析失败: ${e.message}`);
                    }

                    consoleLog("验证通过,找到有效数据!");

                    const filteredData = dataObject;
                    consoleLog("Parsed Data:", filteredData);

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
