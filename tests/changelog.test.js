const fs = require('fs');
const { execSync } = require('child_process');
const generateChangelog = require('../src/changelog');

jest.mock('fs');
jest.mock('child_process');

describe('generateChangelog', () => {
    const config = {
        changelogFile: 'CHANGELOG.md',
        changelog: {
            header: '# Changelog\n\n',
            footer: '---\nFooter here.',
            repositoryUrl: 'https://github.com/your/repo',
            types: [
                { type: 'feat' },
                { type: 'fix' },
            ],
            skip: {
                chore: true,
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        fs.readFileSync.mockReturnValue('# Changelog\n\nOld content\n');
        fs.writeFileSync.mockImplementation(() => {});
    });

    it('writes a changelog with recognized commits', () => {
        execSync.mockReturnValue(Buffer.from(
            'abc123 feat(app): add something\n' +
            'def456 fix(core): fix issue\n' +
            'ghi789 chore(build): ignore this\n'
        ));

        generateChangelog('1.0.0', config);

        const writtenContent = fs.writeFileSync.mock.calls[0][1];
        expect(writtenContent).toMatch(/## v1\.0\.0 \(\d{4}-\d{2}-\d{2}\)/);
        expect(writtenContent).toContain('[abc123](https://github.com/your/repo/commit/abc123): add something');
        expect(writtenContent).toContain('[def456](https://github.com/your/repo/commit/def456): fix issue');
        expect(writtenContent).not.toContain('chore');
        expect(writtenContent).toContain('Footer here.');
    });
});
