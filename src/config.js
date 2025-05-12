const fs = require('fs');

const defaultConfig = {
    files: ['package.json'],
    changelog: {
        header: '# Changelog\n\n',
        types: [
            { type: 'feat', section: '✨ Features' },
            { type: 'fix', section: '🐞 Bug Fixes' }
        ],
        skipInvalidCommits: true
    }
};

function loadConfig() {
    try {
        const customConfig = JSON.parse(fs.readFileSync('.versionrc.json', 'utf-8'));
        return deepMerge(defaultConfig, customConfig);
    } catch {
        return defaultConfig;
    }
}
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

module.exports = {
    loadConfig,
    defaultConfig
};