// validate.test.js
const { execSync } = require('child_process');
const { filterValidCommits, parseGitCommits, createCommitValidator } = require('../src/validate');

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

    test('should treat breaking bang commits as valid conventional commits', () => {
        const validator = createCommitValidator([
            { type: 'feat' },
            { type: 'fix' }
        ]);

        expect(validator.test('feat!: remove old API')).toBe(true);
        expect(validator.test('fix(core)!: change defaults')).toBe(true);
    });

    test('should preserve the body of a valid footer-breaking commit', () => {
        execSync
            .mockReturnValueOnce('v1.2.3')
            .mockReturnValueOnce(
                'abc123\x1ffix(card): align footer\n\n' +
                'BREAKING CHANGE: remove showFooter input\x1e'
            );

        const commits = filterValidCommits({
            changelog: {
                types: [
                    { type: 'feat' },
                    { type: 'fix' }
                ]
            }
        });

        expect(commits).toEqual([{
            hash: 'abc123',
            subject: 'fix(card): align footer',
            body: 'fix(card): align footer\n\nBREAKING CHANGE: remove showFooter input'
        }]);
    });

    test('should parse git commits with full bodies', () => {
        const commits = parseGitCommits(
            'abc123\x1ffeat(api): add endpoint\n\nBREAKING CHANGE: old endpoint removed\x1e'
        );

        expect(commits).toEqual([
            {
                hash: 'abc123',
                subject: 'feat(api): add endpoint',
                body: 'feat(api): add endpoint\n\nBREAKING CHANGE: old endpoint removed'
            }
        ]);
    });
});
