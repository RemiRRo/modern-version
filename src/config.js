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
    // Просто берём массив source, либо можешь сделать Array.concat если нужно сливать
    return source; // или target.concat(source) если надо объединять
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
