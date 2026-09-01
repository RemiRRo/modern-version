const release = require('../src/index');
const { loadConfig } = require('../src/config');
const { filterValidCommits } = require('../src/validate');
const { bumpVersionInFiles } = require('../src/version-files');
const { pseudoBumpVersionInFiles, pseudoGenerateChangelog } = require('../src/dry-run');
const { runHook } = require('../src/hooks');
const { commitChanges, tagVersion } = require('../src/git');
const regenerateChangelog = require('../src/regenerate-changelog');

jest.mock('../src/config');
jest.mock('../src/validate');
jest.mock('../src/version-files');
jest.mock('../src/hooks');
jest.mock('../src/git');
jest.mock('../src/dry-run');
jest.mock('../src/changelog');
jest.mock('../src/regenerate-changelog');

describe('release', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        loadConfig.mockReturnValue({
            files: ['package.json'],
            changelog: { skipInvalidCommits: true },
            scripts: {}
        });

        filterValidCommits.mockReturnValue(['abc123 fix: test change']);
        bumpVersionInFiles.mockReturnValue({ newVersion: '1.0.1' });
        pseudoBumpVersionInFiles.mockReturnValue({ pseudoNewVersion: '1.0.1', filesChanged: [] });
        pseudoGenerateChangelog.mockReturnValue('changelog preview');
        runHook.mockResolvedValue(undefined);
        regenerateChangelog.mockReturnValue({
            content: '# Changelog\n\n## v1.0.0',
            changelogFile: 'CHANGELOG.md',
            tagCount: 1
        });
    });

    test('should execute full release flow', async () => {
        await release({});

        expect(runHook).toHaveBeenCalledWith('prerelease', expect.any(Object), {});
        expect(bumpVersionInFiles).toHaveBeenCalled();
        expect(commitChanges).toHaveBeenCalled();
        expect(tagVersion).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('🚀 Released v1.0.1');
    });

    test('should handle dry-run without committing or tagging', async () => {
        await release({ 'dry-run': true });

        expect(commitChanges).not.toHaveBeenCalled();
        expect(tagVersion).not.toHaveBeenCalled();
        // Проверяем что precommit/pretag хуки не вызываются
        expect(runHook).not.toHaveBeenCalledWith('precommit', expect.any(Object));
        expect(runHook).not.toHaveBeenCalledWith('pretag', expect.any(Object));
    });

    test('should skip changelog related hooks when skip-changelog is true', async () => {
        await release({ 'skip-changelog': true });

        // Проверяем что changelog хуки не вызывались
        const allHookCalls = runHook.mock.calls;
        const changelogHooks = allHookCalls.filter(call =>
            call[0].includes('changelog')
        );
        expect(changelogHooks).toHaveLength(0);
    });

    test('should regenerate changelog without entering the release flow', async () => {
        await release({ 'regenerate-changelog': true });

        expect(regenerateChangelog).toHaveBeenCalledWith(expect.any(Object), { dryRun: false });
        expect(filterValidCommits).not.toHaveBeenCalled();
        expect(runHook).not.toHaveBeenCalled();
        expect(bumpVersionInFiles).not.toHaveBeenCalled();
        expect(commitChanges).not.toHaveBeenCalled();
        expect(tagVersion).not.toHaveBeenCalled();
    });

    test('should preview regenerated changelog without writing it', async () => {
        await release({ 'regenerate-changelog': true, 'dry-run': true });

        expect(regenerateChangelog).toHaveBeenCalledWith(expect.any(Object), { dryRun: true });
        expect(console.log).toHaveBeenCalledWith('# Changelog\n\n## v1.0.0');
        expect(runHook).not.toHaveBeenCalled();
    });
});
