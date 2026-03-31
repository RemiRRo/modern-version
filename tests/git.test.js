// git.test.js
const { execFileSync } = require('child_process');
const { commitChanges, tagVersion } = require('../src/git');

jest.mock('child_process', () => ({
    execFileSync: jest.fn()
}));

describe('git functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('commitChanges should use default message', () => {
        commitChanges('1.0.0', {});
        expect(execFileSync).toHaveBeenNthCalledWith(1, 'git', ['add', '-A'], { stdio: 'inherit' });
        expect(execFileSync).toHaveBeenNthCalledWith(
            2,
            'git', ['commit', '-m', 'chore(release): v1.0.0'],
            { stdio: 'inherit' }
        );
    });

    test('commitChanges should replace {version} in custom message', () => {
        commitChanges('1.0.0', { commitMessage: 'Release {version}' });
        expect(execFileSync).toHaveBeenNthCalledWith(
            2,
            'git', ['commit', '-m', 'Release 1.0.0'],
            { stdio: 'inherit' }
        );
    });

    test('commitChanges should handle message without template', () => {
        commitChanges('1.0.0', { commitMessage: 'Static release message' });
        expect(execFileSync).toHaveBeenNthCalledWith(
            2,
            'git', ['commit', '-m', 'Static release message'],
            { stdio: 'inherit' }
        );
    });

    test('tagVersion should create tag', () => {
        tagVersion('1.0.0', {});
        expect(execFileSync).toHaveBeenCalledWith(
            'git', ['tag', '-a', 'v1.0.0', '-m', 'Version 1.0.0'],
            { stdio: 'inherit' }
        );
    });

    test('tagVersion should skip when config.skip.tag is true', () => {
        tagVersion('1.0.0', { skip: { tag: true } });
        expect(execFileSync).not.toHaveBeenCalled();
    });
});