#!/usr/bin/env node

/**
 * 计算不同 API Key 的今日（24小时）总额度用量
 *
 * 使用方法: node daily-usage.js
 */

const { getConfigField } = require('../config-manager');

// 从 API 获取数据（24小时）
async function fetchFromAPI() {
  const url = 'https://www.aicodemirror.com/api/user/usage?hours=24';

  // 从配置文件读取 Cookie
  const cookies = getConfigField('cookies', null);

  if (!cookies) {
    console.error('❌ 未找到 Cookie 配置');
    console.error('请先运行: node save-cookie.js "你的Cookie"');
    process.exit(1);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'cache-control': 'no-cache',
        'cookie': cookies,
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error('API 请求失败:', error.message);
    process.exit(1);
  }
}

// 计算每个 key 的总用量
function calculateUsage(data) {
  const usageMap = new Map();

  for (const record of data) {
    const key = record.apiKeyLabel;
    const credits = record.creditsUsed || 0;

    if (!usageMap.has(key)) usageMap.set(key, 0);
    usageMap.set(key, usageMap.get(key) + credits);
  }

  return usageMap;
}

// 格式化输出
function formatOutput(usageMap) {
  // 转换为数组并排序（按用量降序）
  const sortedEntries = Array.from(usageMap.entries())
    .sort((a, b) => b[1] - a[1]);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('          API Key 今日总额度用量统计（24小时）');
  console.log('═══════════════════════════════════════════════════\n');

  let totalCredits = 0;

  sortedEntries.forEach(([key, credits], index) => {
    const formattedCredits = (credits / 1000).toFixed(3);
    totalCredits += credits;

    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${key.padEnd(20, ' ')} ${formattedCredits.padStart(10, ' ')}`);
  });

  console.log('\n───────────────────────────────────────────────────');
  console.log(`${'总计'.padEnd(22, ' ')} ${(totalCredits / 1000).toFixed(3).padStart(10, ' ')}`);
  console.log('═══════════════════════════════════════════════════\n');
}

// 主函数
async function main() {
  try {
    const data = await fetchFromAPI();

    if (!Array.isArray(data)) throw new Error('API 返回数据格式错误');

    const usageMap = calculateUsage(data);
    formatOutput(usageMap);

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
