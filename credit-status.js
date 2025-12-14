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
const { loadConfig, updateConfig, getConfigField } = require('./config-manager');

// 缓存配置 - 30秒缓存，避免频繁API调用
const CACHE_DURATION = 30; // 秒

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
            path: '/api/user/profile',
            method: 'GET',
            headers: {
                'Accept': '*/*',
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
                    consoleLog("响应内容:", data);

                    if (res.statusCode !== 200) throw new Error(`非200响应: ${res.statusCode}`);

                    // 直接解析JSON响应
                    const response = JSON.parse(data);
                    consoleLog("解析成功:", response);

                    // 验证必需字段
                    if (!response.user || typeof response.user.credits !== 'number') {
                        throw new Error("响应中缺少必需字段: user.credits");
                    }

                    // 保存到缓存 - 使用配置管理模块，自动保留其他字段
                    updateConfig({
                        [cacheKey]: {
                            data: response,
                            timestamp: currentTime
                        }
                    });

                    resolve(response);
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

function getUsageChart(cookies) {
    return new Promise((resolve) => {
        if (!cookies) {
            resolve(null);
            return;
        }

        // 检查缓存
        const config = loadConfig();
        const cacheKey = 'usage_cache';
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
            path: '/api/user/usage/chart?hours=1',
            method: 'GET',
            headers: {
                'Accept': '*/*',
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
                    consoleLog("-----------Usage Chart", res.statusCode, "-----------");
                    consoleLog("Usage响应内容:", data);

                    if (res.statusCode !== 200) throw new Error(`非200响应: ${res.statusCode}`);

                    // 直接解析JSON响应
                    const response = JSON.parse(data);
                    consoleLog("Usage解析成功:", response);

                    // 验证必需字段 - 期望返回 {chartData: [...]}
                    if (!response.chartData || !Array.isArray(response.chartData) || response.chartData.length === 0) {
                        throw new Error("响应格式不正确或数据为空");
                    }

                    // 读取 chartData 数组的最后一条数据
                    const firstUsage = response.chartData[response.chartData.length - 1];

                    // 保存到缓存 - 使用配置管理模块，自动保留其他字段
                    updateConfig({
                        [cacheKey]: {
                            data: firstUsage,
                            timestamp: currentTime
                        }
                    });

                    resolve(firstUsage);
                } catch (error) {
                    consoleLog("Error processing usage response:", error);
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
    const cookies = getConfigField('cookies', null);
    return cookies ? { cookies } : null;
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

        // 并发执行两个请求
        const [credits, usage] = await Promise.all([
            session ? getCredits(session.cookies) : Promise.resolve(null),
            session ? getUsageChart(session.cookies) : Promise.resolve(null)
        ]);

        // 容错逻辑：一个成功就算成功，除非都失败才视为失败
        const hasAnySuccess = credits !== null || usage !== null;

        // 格式化并输出状态 (请求失败传true，成功传false)
        console.log(formatDisplay(!hasAnySuccess));

    } catch (error) {
        // 即使出错也显示基本信息
        const currentUrl = getDisplayUrl();
        console.log(`🔴 错误 | ${currentUrl}`);
    }
}

if (require.main === module) {
    main();
}
