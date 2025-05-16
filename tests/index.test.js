const release = require('../src/index');
const { loadConfig } = require('../src/config');
const { filterValidCommits } = require('../src/validate');
const { bumpVersionInFiles } = require('../src/version-files');
const { runHook } = require('../src/hooks');
const { commitChanges, tagVersion } = require('../src/git');

jest.mock('../src/config');
jest.mock('../src/validate');
jest.mock('../src/version-files');
jest.mock('../src/hooks');
jest.mock('../src/git');

describe('release', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();

        loadConfig.mockReturnValue({
            files: ['package.json'],
            changelog: {},
            scripts: {}
        });

        bumpVersionInFiles.mockReturnValue({ newVersion: '1.0.1' });
        runHook.mockResolvedValue(undefined);
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
});