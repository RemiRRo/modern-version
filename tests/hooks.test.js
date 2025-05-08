// hooks.test.js
const { execSync } = require('child_process');
const { runHook } = require('../src/hooks');

jest.mock('child_process', () => ({
    execSync: jest.fn(() => 'hook output')
}));

describe('runHook', () => {
    let originalExit;
    let originalError;

    beforeAll(() => {
        originalExit = process.exit;
        originalError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        process.exit = originalExit;
        console.error = originalError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    test('should return null when no hook script', () => {
        const result = runHook('prerelease', {});
        expect(result).toBeNull();
        expect(execSync).not.toHaveBeenCalled();
    });

    test('should run hook script with env vars', () => {
        const config = { scripts: { prerelease: 'echo "Running pre-release"' } };
        const result = runHook('prerelease', config, { foo: 'bar' });

        expect(result).toBe('hook output');
        expect(execSync).toHaveBeenCalledWith('echo "Running pre-release"', {
            stdio: 'inherit',
            env: expect.objectContaining({ foo: 'bar' })
        });
    });

    test('should throw on other hook errors', () => {
        execSync.mockImplementationOnce(() => {
            throw new Error('hook failed');
        });

        const config = { scripts: { postcommit: 'fail' } };

        expect(() => runHook('postcommit', config)).toThrow('hook failed');
    });
});