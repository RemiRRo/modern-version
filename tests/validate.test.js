// validate.test.js
const { execSync } = require('child_process');
const { filterValidCommits } = require('../src/validate');

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
        filterValidCommits();
        expect(console.error).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    test('should handle empty commit list', () => {
        execSync.mockReturnValue('');
        filterValidCommits();
        expect(console.error).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });
});