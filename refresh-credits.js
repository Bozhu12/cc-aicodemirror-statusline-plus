#!/usr/bin/env node
/**
 * 积分刷新脚本 - 用于Stop Hook
 * 强制刷新积分缓存，不显示输出（避免干扰状态栏）
 * 版本: v1.3 (Node.js)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 禁用SSL证书验证警告
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function refreshCreditsCache() {
    return new Promise((resolve) => {
        try {
            // 检查是否使用aicodemirror
            const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
            if (!baseUrl.includes('aicodemirror.com')) {
                // 不是aicodemirror，不需要刷新积分
                resolve(true);
                return;
            }
                
            const configFile = path.join(__dirname, 'aicodemirror-config.json');
            
            if (!fs.existsSync(configFile)) {
                resolve(false);
                return;
            }
                
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            const cookies = config.cookies;
            
            if (!cookies) {
                resolve(false);
                return;
            }
            
            // 调用积分API
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
                            
                            // 更新缓存（强制刷新）
                            config.credits_cache = {
                                data: jsonData,
                                timestamp: Date.now() / 1000
                            };
                            
                            fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } catch (error) {
                        resolve(false);
                    }
                });
            });

            req.on('error', () => {
                resolve(false);
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
            
        } catch (error) {
            resolve(false);
        }
    });
}

async function main() {
    // 静默执行，不输出任何内容
    await refreshCreditsCache();
}

if (require.main === module) {
    main();
}