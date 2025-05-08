// config.test.js
const mockFs = require('mock-fs');
const {loadConfig} = require('../src/config');

describe('loadConfig', () => {
    afterEach(() => {
        mockFs.restore();
    });

    test('should return defaults when no config file exists', () => {
        mockFs();
        const config = loadConfig();
        expect(config).toEqual({
            files: ['package.json'],
            changelog: {
                header: '# Changelog\n\n',
                types: [
                    {type: 'feat', section: '✨ Features'},
                    {type: 'fix', section: '🐞 Bug Fixes'}
                ]
            }
        });
    });

    test('should merge defaults with custom config preserving nested structures', () => {
        mockFs({
            '.versionrc.json': JSON.stringify({
                files: ['package.json', 'package-lock.json'],
                changelog: {
                    header: '# Custom Changelog\n\n',
                    types: [
                        {type: 'feat', section: '🚀 Features'},
                        {type: 'fix', section: '🐛 Bug Fixes'},
                        {type: 'docs', section: '📚 Documentation'}
                    ]
                }
            })
        });

        const config = loadConfig();
        expect(config.files).toEqual(['package.json', 'package-lock.json']);
        expect(config.changelog.header).toBe('# Custom Changelog\n\n');
        expect(config.changelog.types).toEqual([
            {type: 'feat', section: '🚀 Features'},
            {type: 'fix', section: '🐛 Bug Fixes'},
            {type: 'docs', section: '📚 Documentation'}
        ]);
    });

    test('should merge partial changelog config', () => {
        mockFs({
            '.versionrc.json': JSON.stringify({
                changelog: {
                    header: '# Partial Changelog\n\n',
                    types: [
                        {type: 'feat', section: '✨ Features'},
                        {type: 'fix', section: '🐞 Bug Fixes'},
                    ]
                }
            })
        });

        const config = loadConfig();
        expect(config.changelog.header).toBe('# Partial Changelog\n\n');
        expect(config.changelog.types).toEqual([
            {type: 'feat', section: '✨ Features'},
            {type: 'fix', section: '🐞 Bug Fixes'}
        ]);
    });
});