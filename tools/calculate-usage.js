/**
 * 计算今日额度使用量
 */

const { getConfigField } = require('../config-manager');

async function getTodayUsage() {
  const url = 'https://www.aicodemirror.com/api/user/usage/chart?hours=24';

  // 从配置文件读取 Cookie
  const cookies = getConfigField('cookies', null);

  if (!cookies) {
    console.error('❌ 未找到 Cookie 配置');
    console.error('请先运行: node save-cookie.js "你的Cookie"');
    process.exit(1);
  }

  const headers = {
    'accept': '*/*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'cache-control': 'no-cache',
    'cookie': cookies,
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://www.aicodemirror.com/dashboard/usage',
    'sec-ch-ua': '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 明确今日日期范围（本地时间）
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('今日日期范围（本地时间）:');
    console.log('  开始:', today.toLocaleString('zh-CN'));
    console.log('  结束:', tomorrow.toLocaleString('zh-CN'));
    console.log('');

    // 过滤今日数据并累加 consumed
    let totalConsumed = 0;
    const todayData = [];

    // 数据在 chartData 字段中
    const chartData = data?.chartData || [];

    console.log('接口返回数据条数:', chartData.length);
    console.log('');

    chartData.forEach(item => {
      // 使用 hour 字段（UTC 时间），转换为本地时间
      const itemDate = new Date(item.hour);

      console.log(`  ${item.hour} -> ${itemDate.toLocaleString('zh-CN')} consumed: ${item.consumed}`);

      // 只统计今日数据（比较本地时间）
      if (itemDate >= today && itemDate < tomorrow) {
        todayData.push(item);
        totalConsumed += parseFloat(item.consumed || 0);
      }
    });

    console.log('');

    // 转换为保留三位小数（1405 -> 1.405）
    const todayUsage = (totalConsumed / 1000).toFixed(3);

    console.log('今日数据条数:', todayData.length);
    console.log('今日数据明细:', JSON.stringify(todayData, null, 2));
    console.log('');
    console.log('今日 consumed 总和:', totalConsumed);
    console.log('今日额度使用量:', todayUsage);

    return {
      todayUsage,
      totalConsumed,
      todayData,
      rawData: data
    };

  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;
  }
}

// 执行函数
getTodayUsage()
  .then(result => {
    console.log('\n计算完成!');
  })
  .catch(error => {
    console.error('执行出错:', error);
    process.exit(1);
  });
