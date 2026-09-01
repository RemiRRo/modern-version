// hooks.test.js
const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { runHook, getHookResult } = require('../src/hooks');

jest.mock('child_process', () => ({
    spawn: jest.fn()
}));

function mockSpawn({ stdout = '', stderr = '', code = 0 } = {}) {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    spawn.mockReturnValue(child);

    process.nextTick(() => {
        if (stdout) child.stdout.emit('data', Buffer.from(stdout));
        if (stderr) child.stderr.emit('data', Buffer.from(stderr));
        child.emit('close', code);
    });

    return child;
}

describe('runHook', () => {
    let originalExit;
    let originalError;
    let originalStdoutWrite;
    let originalStderrWrite;

    beforeAll(() => {
        originalExit = process.exit;
        originalError = console.error;
        originalStdoutWrite = process.stdout.write;
        originalStderrWrite = process.stderr.write;
        console.error = jest.fn();
        process.stdout.write = jest.fn();
        process.stderr.write = jest.fn();
    });

    afterAll(() => {
        process.exit = originalExit;
        console.error = originalError;
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    test('should return null when no hook script', async () => {
        const result = await runHook('prerelease', {});
        expect(result).toBeNull();
        expect(spawn).not.toHaveBeenCalled();
    });

    test('should run hook script with env vars and stream output', async () => {
        mockSpawn({ stdout: 'tests passed\n' });
        const config = { scripts: { precommit: 'npm run test' } };
        const result = await runHook('precommit', config, { foo: 'bar' });

        expect(result).toBeNull();
        expect(spawn).toHaveBeenCalledWith('npm run test', {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe'],
            env: expect.objectContaining({ foo: 'bar' })
        });
        expect(process.stdout.write).toHaveBeenCalledWith(Buffer.from('tests passed\n'));
    });

    test('should capture valid prebump version from the last output line', async () => {
        mockSpawn({ stdout: 'running checks\n1.2.3\n' });
        const config = { scripts: { prebump: 'echo "1.2.3"' } };
        const result = await runHook('prebump', config);

        expect(result).toBe('1.2.3');
    });

    test('should ignore non-version prebump output', async () => {
        mockSpawn({ stdout: 'PASS tests/hooks.test.js\n' });
        const config = { scripts: { prebump: 'npm run test' } };
        const result = await runHook('prebump', config);

        expect(result).toBeNull();
    });

    test('should throw on other hook errors', async () => {
        mockSpawn({ code: 1 });
        const config = { scripts: { postcommit: 'fail' } };

        await expect(runHook('postcommit', config)).rejects.toThrow('postcommit hook failed with exit code 1');
    });
});

describe('getHookResult', () => {
    test('should return null for non-prebump hooks', () => {
        expect(getHookResult('precommit', '1.2.3\n')).toBeNull();
    });

    test('should return null when prebump output is not a valid version', () => {
        expect(getHookResult('prebump', 'tests passed\n')).toBeNull();
    });
});
