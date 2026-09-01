// version-files.test.js
const mockFs = require('mock-fs');
const { bumpVersionInFiles, calculateVersion, detectBump } = require('../src/version-files');

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

        test('should use custom version before auto-detected bump type', () => {
            const config = { files: ['package.json'] };
            const result = bumpVersionInFiles(config, {}, '2.0.0', ['abc123 feat: add feature']);

            expect(result.newVersion).toBe('2.0.0');
        });
    });

    describe('detectBump', () => {
        test('should return patch for only fix commits', () => {
            expect(detectBump(['abc123 fix: fix issue'])).toBe('patch');
        });

        test('should return minor when feat commit exists', () => {
            expect(detectBump(['abc123 fix: fix issue', 'def456 feat: add feature'])).toBe('minor');
        });

        test('should return minor for default feat aliases', () => {
            expect(detectBump(['abc123 features: add capability'])).toBe('minor');
            expect(detectBump(['abc123 feature: add capability'])).toBe('minor');
        });

        test('should return minor for feat with scope', () => {
            expect(detectBump(['abc123 feat(api): add endpoint'])).toBe('minor');
        });

        test('should return minor for feat with scope and breaking marker', () => {
            expect(detectBump(['abc123 feat(api)!: change endpoint'])).toBe('minor');
        });

        test('should return minor for a breaking marker regardless of commit type', () => {
            expect(detectBump(['abc123 refactor(api)!: change endpoint'])).toBe('minor');
        });

        test('should return minor for a breaking change footer regardless of commit type', () => {
            expect(detectBump([{
                hash: 'abc123',
                subject: 'fix(card): align footer',
                body: 'fix(card): align footer\n\nBREAKING CHANGE: remove showFooter input'
            }])).toBe('minor');
        });

        test('should return patch for empty commits', () => {
            expect(detectBump([])).toBe('patch');
        });

        test('should use custom minor bump types from config', () => {
            expect(detectBump(['abc123 change: add capability'], {
                bumpTypes: {
                    minor: ['change']
                }
            })).toBe('minor');
        });

        test('should detect a multiline breaking change footer', () => {
            expect(detectBump([{
                hash: 'abc123',
                subject: 'fix(card): change footer API',
                body: [
                    'fix(card): change footer API',
                    '',
                    'BREAKING CHANGE: remove showFooter input',
                    'Use the footer slot instead.'
                ].join('\n')
            }])).toBe('minor');
        });
    });

    describe('calculateVersion', () => {
        test('should use release-as major over auto-detected bump type', () => {
            const result = calculateVersion('1.0.0', { 'release-as': 'major' }, ['abc123 feat: add feature']);
            expect(result).toBe('2.0.0');
        });

        test('should use release-as minor over auto-detected bump type', () => {
            const result = calculateVersion('1.0.0', { 'release-as': 'minor' }, ['abc123 fix: fix issue']);
            expect(result).toBe('1.1.0');
        });

        test('should use release-as patch over auto-detected bump type', () => {
            const result = calculateVersion('1.0.0', { 'release-as': 'patch' }, ['abc123 feat: add feature']);
            expect(result).toBe('1.0.1');
        });

        test('should calculate prerelease version', () => {
            const result = calculateVersion('1.0.0', { 'prerelease': 'beta' }, ['abc123 feat: add feature']);
            expect(result).toBe('1.0.1-beta.0');
        });

        test('should use release-as if provided', () => {
            const result = calculateVersion('1.0.0', { 'release-as': '2.0.0' });
            expect(result).toBe('2.0.0');
        });

        test('should preserve the legacy two-argument call', () => {
            const result = calculateVersion('1.2.3', {});
            expect(result).toBe('1.2.4');
        });

        test('should auto-detect minor version from commits', () => {
            const result = calculateVersion('1.0.0', {}, ['abc123 feat: add feature']);
            expect(result).toBe('1.1.0');
        });
    });
});
