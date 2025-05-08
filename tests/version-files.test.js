// version-files.test.js
const mockFs = require('mock-fs');
const { bumpVersionInFiles, calculateVersion } = require('../src/version-files');

describe('version-files', () => {
    beforeEach(() => {
        mockFs({
            'package.json': JSON.stringify({ version: '1.0.0' }),
            'test.json': JSON.stringify({ version: '1.0.0', name: 'test' }),
            'test.txt': 'version="1.0.0"'
        });
    });

    afterEach(() => {
        mockFs.restore();
    });

    describe('bumpVersionInFiles', () => {
        test('should bump version in JSON files', () => {
            const config = { files: ['package.json', 'test.json'] };
            const result = bumpVersionInFiles(config, {}, '1.1.0');

            expect(result.newVersion).toBe('1.1.0');

            const pkg = JSON.parse(require('fs').readFileSync('package.json', 'utf-8'));
            expect(pkg.version).toBe('1.1.0');

            const testFile = JSON.parse(require('fs').readFileSync('test.json', 'utf-8'));
            expect(testFile.version).toBe('1.1.0');
        });

        test('should bump version in non-JSON files', () => {
            const config = { files: ['test.txt'] };
            bumpVersionInFiles(config, {}, '1.1.0');

            const content = require('fs').readFileSync('test.txt', 'utf-8');
            expect(content).toBe('version="1.1.0"');
        });
    });

    describe('calculateVersion', () => {
        test('should calculate prerelease version', () => {
            const result = calculateVersion('1.0.0', { prerelease: 'beta' });
            expect(result).toBe('1.0.1-beta.0');
        });

        test('should use release-as if provided', () => {
            const result = calculateVersion('1.0.0', { releaseAs: '2.0.0' });
            expect(result).toBe('2.0.0');
        });

        test('should bump patch version by default', () => {
            const result = calculateVersion('1.0.0', {});
            expect(result).toBe('1.0.1');
        });
    });
});