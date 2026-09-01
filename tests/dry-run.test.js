const mockFs = require('mock-fs');
const { limitChangelogPreview } = require('../src/dry-run');
const { pseudoBumpVersionInFiles } = require('../src/dry-run');

describe('dry-run changelog preview', () => {
  afterEach(() => {
    mockFs.restore();
  });

  test('detects the same bump type as real release', () => {
    mockFs({
      'package.json': JSON.stringify({ version: '1.0.0' })
    });

    const result = pseudoBumpVersionInFiles({}, {}, undefined, ['abc123 feat: add feature']);

    expect(result.pseudoNewVersion).toBe('1.1.0');
  });

  test('limits changelog output to the newest three versions', () => {
    const preview = limitChangelogPreview(
      '# CHANGELOG\n\n' +
      '## v1.0.4 (2026-01-04)\n\n- newest\n\n' +
      '## v1.0.3 (2026-01-03)\n\n- previous\n\n' +
      '## v1.0.2 (2026-01-02)\n\n- previous\n\n' +
      '## v1.0.1 (2026-01-01)\n\n- old\n'
    );

    expect(preview).toContain('# CHANGELOG');
    expect(preview).toContain('## v1.0.4');
    expect(preview).toContain('## v1.0.3');
    expect(preview).toContain('## v1.0.2');
    expect(preview).not.toContain('## v1.0.1');
  });

  test('returns non-version changelog content unchanged', () => {
    expect(limitChangelogPreview('# CHANGELOG\n\nNo releases yet')).toBe('# CHANGELOG\n\nNo releases yet');
  });
});
