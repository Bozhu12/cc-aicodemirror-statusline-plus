/**
 * 配置管理模块 - 统一管理 aicodemirror-config.json 的读写操作
 *
 * 功能:
 * - 原子读取配置
 * - 安全更新配置（部分更新，保留其他字段）
 * - 防止并发写入导致数据丢失
 *
 * 版本: v1.0
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'aicodemirror-config.json');

/**
 * 原子读取配置
 * @returns {Object} 配置对象，失败返回空对象
 */
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return {};
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 配置文件损坏或不存在时返回空对象
        return {};
    }
}

/**
 * 原子更新配置（部分更新，保留其他字段）
 * @param {Object} updates - 要更新的字段键值对
 * @returns {boolean} 成功返回 true，失败返回 false
 *
 * @example
 * // 更新单个字段
 * updateConfig({ cookies: 'new-cookie-value' });
 *
 * // 更新多个字段
 * updateConfig({
 *   cookies: 'new-cookie',
 *   credits_cache: { data: {...}, timestamp: 123456 }
 * });
 */
function updateConfig(updates) {
    try {
        // 1. 读取最新配置（避免覆盖其他进程的更新）
        const config = loadConfig();

        // 2. 合并更新（保留其他字段）
        Object.assign(config, updates);

        // 3. 确保目录存在
        const configDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // 4. 写入文件
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

        return true;
    } catch (error) {
        // 写入失败时静默处理
        return false;
    }
}

/**
 * 更新特定字段（便捷方法）
 * @param {string} key - 字段名
 * @param {*} value - 字段值
 * @returns {boolean} 成功返回 true，失败返回 false
 *
 * @example
 * setConfigField('cookies', 'new-cookie-value');
 * setConfigField('credits_cache', { data: {...}, timestamp: 123456 });
 */
function setConfigField(key, value) {
    return updateConfig({ [key]: value });
}

/**
 * 获取特定字段的值
 * @param {string} key - 字段名
 * @param {*} defaultValue - 默认值（字段不存在时返回）
 * @returns {*} 字段值或默认值
 *
 * @example
 * const cookies = getConfigField('cookies', null);
 * const cache = getConfigField('credits_cache', {});
 */
function getConfigField(key, defaultValue = null) {
    const config = loadConfig();
    return config[key] !== undefined ? config[key] : defaultValue;
}

/**
 * 删除特定字段
 * @param {string} key - 字段名
 * @returns {boolean} 成功返回 true，失败返回 false
 */
function deleteConfigField(key) {
    try {
        const config = loadConfig();
        delete config[key];

        const configDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    loadConfig,
    updateConfig,
    setConfigField,
    getConfigField,
    deleteConfigField,
    CONFIG_FILE
};
