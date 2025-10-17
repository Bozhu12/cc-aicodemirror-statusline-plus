/**
 * 显示格式化工具模块
 * 用于格式化状态栏显示信息
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {execSync} = require('child_process');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'aicodemirror-config.json');


/**
 * 格式化显示状态栏信息
 *
 * @param {boolean} warning 是否显示警告信息
 * @returns {string} 格式化后的状态栏文本
 */
function formatDisplay(warning) {
    // ANSI紫色转义序列，颜色为 #BD93F9 (RGB: 189, 147, 249)
    const purple = '\x1b[38;2;189;147;249m';
    /// 红色加粗
    const red = '\x1b[31;1m';
    // ANSI重置转义序列，用于将终端输出颜色重置为默认值
    const reset = '\x1b[0m';

    // 从配置文件中加载所有配置信息
    const config = loadConfig();
    // 缓存键名，用于访问积分缓存数据
    const cacheKey = 'credits_cache';
    // 从配置对象中提取积分数据，如果缓存不存在则为null
    const data = config[cacheKey] ? config[cacheKey].data : null;

    // 如果没有积分数据，返回需要Cookie的提示信息
    if (!data) return `${red}🍪 json解析异常${reset}`;

    // 当前Git分支名称，如果不在Git仓库中则为null
    const currentBranch = getCurrentBranch();
    // 当前Git仓库中已修改文件的数量
    const modifiedFilesCount = getModifiedFilesCount();
    // 当前工作空间的绝对路径
    const currentWorkspace = getCurrentWorkspace();
    // 当前输出样式名称（从配置文件或环境变量中获取）
    const currentOutputStyle = getCurrentOutputStyle();

    try {
        // 输出样式部分的显示字符串
        const stylePart = currentOutputStyle === 'default' ? '' : `${currentOutputStyle}`;
        // Git分支信息部分的显示字符串，格式为：分支名(修改文件数)
        const branchPart = currentBranch ? `${currentBranch}(${modifiedFilesCount})` : '';
        // 工作空间路径部分的显示字符串
        const workspacePart = `${currentWorkspace}`;

        // 当前每日已使用的积分数量
        const dailyCurrent = data.creditData.current || 0;
        // 每日积分的最大限制数量
        const dailyMax = data.creditData.max || 0;
        // 每日积分使用百分比，限制在0-100之间
        const dailyPercentage = dailyMax > 0 ? Math.min(100, Math.max(0, Math.round((dailyCurrent / dailyMax) * 100))) : 0;
        // 本周已使用的积分数量
        const weeklyUsed = data.weeklyUsageData.weeklyUsed || 0;
        // 每周积分的总限制数量
        const weeklyLimit = data.weeklyUsageData.weeklyLimit || 0;
        // 每周积分使用百分比，限制在0-100之间
        const weeklyPercentage = weeklyLimit > 0 ? Math.min(100, Math.max(0, Math.round((weeklyUsed / weeklyLimit) * 100))) : 0;
        // 用户订阅计划类型（ULTRA/MAX/PRO/FREE）
        const plan = data.userPlan || 'FREE';
        // 根据用户计划类型获取对应的图标（👑/💎/⭐/🆓）
        const planIcon = getPlanIcon(data.userPlan);
        // 今天是否可以重置积分的布尔值标记
        const canResetToday = data.creditData.canResetToday || false;
        // 当前使用的AI模型名称（haiku/sonnet/opus/auto）
        const currentModel = getCurrentModel();

        // 真实数值 (含有重置数值)
        let realDailyCurrent = dailyCurrent;
        try {
            if (canResetToday) realDailyCurrent = parseInt(dailyCurrent.trim()) + parseInt(dailyMax.trim());
        } catch (error) {
        }

        // 构建状态栏信息，自动过滤空白部分
        const infoParts = buildSeparatedString([
            `${planIcon} ${realDailyCurrent}/${weeklyLimit - weeklyUsed} (${currentModel})`,
            stylePart,
            branchPart,
            workspacePart
        ]);

        // 返回格式化后的状态栏显示字符串
        return `${warning ? red : purple}${infoParts}${reset}`;
    } catch (error) {
        // 在catch块中获取当前模型（用于错误情况下的显示）
        const currentModel = getCurrentModel();
        // 返回数据解析失败的错误提示
        return `${red}🔴 数据解析失败${reset}`;
    }
}

/**
 * 构建带分隔符的字符串，自动忽略空白部分
 * @param {Array<string>} parts 需要连接的部分
 * @param {string} separator 分隔符，默认为 ' | '
 * @returns {string} 连接后的字符串
 */
function buildSeparatedString(parts, separator = ' | ') {
    return parts.filter(part => part && part.trim()).join(separator);
}

/**
 * 加载配置文件
 * @returns {object} 配置对象
 */
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

/**
 * 获取当前使用的模型
 * @returns {string} 模型名称 (haiku/sonnet/opus/auto)
 */
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
        if (model.toLowerCase().includes('haiku')) {
            return 'haiku';
        } else if (model.toLowerCase().includes('sonnet')) {
            return 'sonnet';
        } else if (model.toLowerCase().includes('opus')) {
            return 'opus';
        }
    }

    return 'auto';
}

/**
 * 获取当前输出样式
 * @returns {string} 输出样式名称
 */
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

/**
 * 获取当前 Git 分支名
 * @returns {string|null} 分支名或 null
 */
function getCurrentBranch() {
    try {
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

/**
 * 获取修改文件数量
 * @returns {number} 修改文件数量
 */
function getModifiedFilesCount() {
    try {
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

/**
 * 获取当前工作空间路径
 * @returns {string} 工作空间路径
 */
function getCurrentWorkspace() {
    try {
        return process.cwd();
    } catch (error) {
        return 'unknown';
    }
}

/**
 * 根据计划类型获取对应图标
 * @param {string} plan 计划类型
 * @returns {string} 图标
 */
function getPlanIcon(plan) {
    const planIcons = {
        'ULTRA': '👑',
        'MAX': '💎',
        'PRO': '⭐',
        'FREE': '🆓'
    };
    return planIcons[plan] || '❓';
}

module.exports = {
    getCurrentModel,
    getCurrentOutputStyle,
    getCurrentBranch,
    getModifiedFilesCount,
    getCurrentWorkspace,
    getPlanIcon,
    formatDisplay
};
