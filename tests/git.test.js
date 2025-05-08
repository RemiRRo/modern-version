// git.test.js
const { execSync } = require('child_process');
const { commitChanges, tagVersion } = require('../src/git');

jest.mock('child_process', () => ({
    execSync: jest.fn()
}));

describe('git functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('commitChanges should use default message', () => {
        commitChanges('1.0.0', {});
        expect(execSync).toHaveBeenNthCalledWith(1, 'git add -A', { stdio: 'inherit' });
        expect(execSync).toHaveBeenNthCalledWith(
            2,
            'git commit -m "chore(release): v1.0.0"',
            { stdio: 'inherit' }
        );
    });

    test('commitChanges should replace {version} in custom message', () => {
        commitChanges('1.0.0', { commitMessage: 'Release {version}' });
        expect(execSync).toHaveBeenNthCalledWith(
            2,
            'git commit -m "Release 1.0.0"',
            { stdio: 'inherit' }
        );
    });

    test('commitChanges should handle message without template', () => {
        commitChanges('1.0.0', { commitMessage: 'Static release message' });
        expect(execSync).toHaveBeenNthCalledWith(
            2,
            'git commit -m "Static release message"',
            { stdio: 'inherit' }
        );
    });

    test('tagVersion should create tag', () => {
        tagVersion('1.0.0', {});
        expect(execSync).toHaveBeenCalledWith(
            'git tag -a v1.0.0 -m "Version 1.0.0"',
            { stdio: 'inherit' }
        );
    });

    test('tagVersion should skip when config.skip.tag is true', () => {
        tagVersion('1.0.0', { skip: { tag: true } });
        expect(execSync).not.toHaveBeenCalled();
    });
});