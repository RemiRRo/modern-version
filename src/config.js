const fs = require('fs');
const path = require('path');

function loadConfig() {
    const configPath = path.resolve('.versionrc.json');
    const defaults = {
        files: ['package.json'],
        changelog: {
            header: '# Changelog\n\n',
            types: [
                { type: 'feat', section: '✨ Features' },
                { type: 'fix', section: '🐞 Bug Fixes' }
            ]
        }
    };

    try {
        return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
    } catch {
        return defaults;
    }
}

module.exports = { loadConfig };