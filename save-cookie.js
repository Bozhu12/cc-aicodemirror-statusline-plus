#!/usr/bin/env node
/**
 * 最简单的Cookie保存工具
 * 版本: v1.3 (Node.js)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

function saveCookie() {
    if (process.argv.length !== 3) {
        console.log("使用方法: node save-cookie.js '你的Cookie字符串'");
        console.log();
        console.log("📝 步骤：");
        console.log("1. 浏览器登录 https://www.aicodemirror.com/dashboard");
        console.log("2. F12 -> Network -> 刷新页面 -> 找到 /dashboard");
        console.log("3. 复制Cookie值");
        console.log("4. node save-cookie.js 'Cookie内容'");
        return false;
    }
    
    const cookie = process.argv[2].trim();
    
    if (!cookie) {
        console.log("❌ Cookie不能为空");
        return false;
    }
    
    // 保存配置到当前目录
    const configFile = path.join(__dirname, 'aicodemirror-config.json');
    const config = { cookies: cookie };
    
    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        
        console.log(`✅ Cookie已保存到: ${configFile}`);
        console.log(`📏 Cookie长度: ${cookie.length} 字符`);
        
        // 测试
        console.log("\n🧪 正在测试...");
        
        const scriptPath = path.join(os.homedir(), '.claude', 'statusline', 'credit-status.js');
        const fallbackPath = path.join(__dirname, 'credit-status.js');
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
            
            if (result.includes('🍪')) {
                console.log("❌ Cookie无效，请重新获取");
            } else if (result.includes('积分')) {
                console.log("✅ 测试成功！");
                console.log("🎉 现在重启Claude Code即可看到状态栏积分显示");
            } else {
                console.log("⚠️ 输出异常，但Cookie已保存");
            }
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
