const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../bin/cli.js');
const temporaryRepositories = [];

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Modern Version Test',
      GIT_AUTHOR_EMAIL: 'modern-version@example.com',
      GIT_COMMITTER_NAME: 'Modern Version Test',
      GIT_COMMITTER_EMAIL: 'modern-version@example.com'
    }
  });
}

function commit(repository, subject, body) {
  const args = ['commit', '--quiet', '--allow-empty', '-m', subject];
  if (body) args.push('-m', body);
  run('git', args, repository);
}

function createRepository() {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-version-regenerate-'));
  temporaryRepositories.push(repository);

  const config = {
    changelog: {
      header: '# Changelog\n\n',
      types: [
        { type: 'feat', section: 'Features' },
        { type: 'fix', section: 'Fixes' },
        { type: 'chore', section: 'Chores' }
      ],
      skipInvalidCommits: true
    },
    bumpTypes: { minor: ['feat'] }
  };

  fs.writeFileSync(path.join(repository, 'package.json'), JSON.stringify({
    name: 'regenerate-fixture',
    version: '1.2.0'
  }, null, 2));
  fs.writeFileSync(path.join(repository, '.versionrc.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(repository, 'CHANGELOG.md'), '# Changelog\n\nStale content\n');

  run('git', ['init', '--quiet'], repository);
  run('git', ['add', '.'], repository);
  commit(repository, 'chore: initial release');
  run('git', ['tag', '-a', 'v1.0.0', '-m', 'Version 1.0.0'], repository);

  commit(
    repository,
    'fix(card): align footer',
    ['BREAKING CHANGE: removed showFooter input; use the slot.', 'Update all card templates before upgrading.'].join('\n')
  );
  commit(
    repository,
    'legacy(api): remove old endpoint',
    'BREAKING CHANGE: use the v2 endpoint instead.'
  );
  commit(repository, 'chore: release 1.0.9');
  commit(repository, 'chore(release): v1.1.0');
  run('git', ['tag', '-a', 'v1.1.0', '-m', 'Version 1.1.0'], repository);

  commit(repository, 'feat: add dashboard');
  commit(repository, 'chore(release): v1.2.0');
  run('git', ['tag', '-a', 'v1.2.0', '-m', 'Version 1.2.0'], repository);

  return repository;
}

function snapshotRepository(repository) {
  return {
    head: run('git', ['rev-parse', 'HEAD'], repository).trim(),
    tags: run('git', ['tag', '--list'], repository).trim(),
    packageJson: fs.readFileSync(path.join(repository, 'package.json'), 'utf8')
  };
}

afterEach(() => {
  temporaryRepositories.splice(0).forEach(repository => {
    fs.rmSync(repository, { recursive: true, force: true });
  });
});

describe('changelog regeneration through the CLI', () => {
  test('dry-run previews every tagged release without changing the repository', () => {
    const repository = createRepository();
    const before = snapshotRepository(repository);

    const output = run(process.execPath, [
      CLI_PATH,
      '--regenerate-changelog',
      '--dry-run'
    ], repository);

    expect(output).toContain('Would regenerate CHANGELOG.md from 3 version tags');
    expect(output).toContain('## v1.2.0');
    expect(output).toContain('## v1.1.0');
    expect(output).toContain('## v1.0.0');
    expect(output).toContain('### ⚠️ Breaking Changes');
    expect(output).toContain('removed showFooter input; use the slot.');
    expect(output).toContain('Update all card templates before upgrading.');
    expect(output).toContain('use the v2 endpoint instead.');
    expect(fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8')).toContain('Stale content');
    expect(snapshotRepository(repository)).toEqual(before);
  });

  test('rewrites only the changelog and excludes release commits', () => {
    const repository = createRepository();
    const before = snapshotRepository(repository);

    const output = run(process.execPath, [CLI_PATH, '--regenerate-changelog'], repository);
    const changelog = fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8');

    expect(output).toContain('Regenerated CHANGELOG.md from 3 version tags');
    expect(changelog).not.toContain('Stale content');
    expect(changelog.indexOf('## v1.2.0')).toBeLessThan(changelog.indexOf('## v1.1.0'));
    expect(changelog.indexOf('## v1.1.0')).toBeLessThan(changelog.indexOf('## v1.0.0'));
    expect(changelog).toContain('### Features');
    expect(changelog).toContain('### Fixes');
    expect(changelog).toContain('removed showFooter input; use the slot.');
    expect(changelog).toContain('use the v2 endpoint instead.');
    expect(changelog).not.toContain('chore(release)');
    expect(changelog).not.toContain('release 1.0.9');

    const after = snapshotRepository(repository);
    expect(after).toEqual(before);
  });

  test('fails without changing the changelog when there are no version tags', () => {
    const repository = createRepository();
    run('git', ['tag', '--delete', 'v1.0.0', 'v1.1.0', 'v1.2.0'], repository);
    const changelogBefore = fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8');

    let error;
    try {
      run(process.execPath, [CLI_PATH, '--regenerate-changelog'], repository);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(1);
    expect(error.stderr).toContain('No reachable semantic version tags found');
    expect(fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8')).toBe(changelogBefore);
  });
});
