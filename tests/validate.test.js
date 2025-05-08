// validate.test.js
const { execSync } = require('child_process');
const { validateCommits } = require('../src/validate');

jest.mock('child_process', () => ({
    execSync: jest.fn()
}));

describe('validateCommits', () => {
    let originalExit;
    let originalError;

    beforeAll(() => {
        originalExit = process.exit;
        originalError = console.error;
        process.exit = jest.fn();
        console.error = jest.fn();
    });

    afterAll(() => {
        process.exit = originalExit;
        console.error = originalError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should pass with valid commits', () => {
        execSync.mockReturnValue('feat: new feature\nfix: bug fix\nchore: something');
        validateCommits();
        expect(console.error).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('should fail and show error message with invalid commits', () => {
        execSync.mockReturnValue('feat: new feature\ninvalid commit\nfix: bug fix');
        validateCommits();
        expect(console.error).toHaveBeenCalledWith(
            '❌ Invalid commits:\n',
            'invalid commit'
        );
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should handle empty commit list', () => {
        execSync.mockReturnValue('');
        validateCommits();
        expect(console.error).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });
});