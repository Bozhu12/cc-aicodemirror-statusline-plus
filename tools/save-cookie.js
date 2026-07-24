#!/usr/bin/env node
/**
 * 最简单的Cookie保存工具
 * 版本: v1.3 (Node.js)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { updateConfig, getConfigField, CONFIG_FILE } = require('../config-manager');

const DEFAULT_BASE_URL = 'https://www.aicodemirror.ai';

function saveCookie() {
    if (process.argv.length < 3 || process.argv.length > 4) {
        console.log("使用方法: node save-cookie.js '你的Cookie字符串' [官网base_url]");
        console.log();
        console.log("📝 步骤：");
        console.log(`1. 浏览器登录 ${DEFAULT_BASE_URL}/dashboard`);
        console.log("2. F12 -> Network -> 刷新页面 -> 官网域名的任意接口");
        console.log("3. 复制Cookie值");
        console.log("4. node save-cookie.js 'Cookie内容'");
        console.log();
        console.log(`💡 官网若换域名，可传入第二个参数覆盖，例如：`);
        console.log(`   node save-cookie.js 'Cookie内容' https://www.aicodemirror.ai`);
        return false;
    }

    const cookie = process.argv[2].trim();
    const baseUrl = (process.argv[3] || '').trim();

    if (!cookie) {
        console.log("❌ Cookie不能为空");
        return false;
    }

    // 使用配置管理模块保存 Cookie（保留其他字段）
    try {
        // 传入了 base_url 就一并更新；否则若配置里还没有则写入默认值
        const configUpdate = { cookies: cookie };
        if (baseUrl) {
            configUpdate.base_url = baseUrl;
        } else if (!getConfigField('base_url', '')) {
            configUpdate.base_url = DEFAULT_BASE_URL;
        }

        const success = updateConfig(configUpdate);

        if (!success) {
            throw new Error('写入配置文件失败');
        }

        console.log(`✅ Cookie已保存到: ${CONFIG_FILE}`);
        console.log(`📏 Cookie长度: ${cookie.length} 字符`);
        console.log(`🌐 官网域名(base_url): ${configUpdate.base_url || getConfigField('base_url', DEFAULT_BASE_URL)}`);

        // 测试
        console.log("\n🧪 正在测试...");

        const scriptPath = path.join(os.homedir(), '.claude', 'statusline', 'credit-status.js');
        const fallbackPath = path.join(__dirname, '..', 'credit-status.js');
        const testScript = fs.existsSync(scriptPath) ? scriptPath : fallbackPath;

        const testProcess = spawn('node', [testScript], {
            stdio: 'pipe',
            timeout: 10000
        });

        let output = '';
        testProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        testProcess.on('close', (code) => {
            const result = output.trim();
            console.log(`测试结果: ${result}`);
        });

        testProcess.on('error', (error) => {
            console.log(`⚠️ 测试执行失败: ${error.message}`);
            console.log("但Cookie已成功保存");
        });

        return true;

    } catch (error) {
        console.log(`❌ 保存失败: ${error.message}`);
        return false;
    }
}

if (require.main === module) {
    saveCookie();
}
