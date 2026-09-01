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
  },
  bumpTypes: {
    minor: ['feat', 'features', 'feature']
  }
};

function loadConfig() {
  try {
    const customConfig = JSON.parse(fs.readFileSync('.versionrc.json', 'utf-8'));
    // Глубокая проверка структуры
    if (customConfig.changelog && !Array.isArray(customConfig.changelog.types)) {
      console.error('⚠️ Invalid "types" in .versionrc.json. Using defaults.');
      customConfig.changelog.types = defaultConfig.changelog.types;
    }
    return deepMerge(defaultConfig, customConfig);
  } catch (e) {
    console.error('⚠️ Error loading .versionrc.json:', e.message);
    return defaultConfig;
  }
}

function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source;
  }
  if (target instanceof Object && source instanceof Object) {
    const result = { ...target };
    for (const key in source) {
      result[key] = deepMerge(target[key], source[key]);
    }
    return result;
  }
  return source;
}

module.exports = {
    loadConfig,
    defaultConfig
};
