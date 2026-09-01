const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../bin/cli.js');
const VERSION_CONFIG = {
  changelog: {
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Fixes' },
      { type: 'docs', section: 'Docs' },
      { type: 'chore', section: 'Chores' }
    ],
    skipInvalidCommits: true
  },
  bumpTypes: {
    minor: ['feat', 'features', 'feature']
  }
};

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

function createRepository(commits = [], config = VERSION_CONFIG) {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-version-bump-'));
  temporaryRepositories.push(repository);

  fs.writeFileSync(
    path.join(repository, 'package.json'),
    JSON.stringify({ name: 'modern-version-fixture', version: '1.2.3' }, null, 2)
  );
  fs.writeFileSync(
    path.join(repository, '.versionrc.json'),
    JSON.stringify(config, null, 2)
  );

  run('git', ['init', '--quiet'], repository);
  run('git', ['add', 'package.json', '.versionrc.json'], repository);
  run('git', ['commit', '--quiet', '-m', 'chore: initial'], repository);
  run('git', ['tag', 'v1.2.3'], repository);

  commits.forEach(commit => {
    const subject = typeof commit === 'string' ? commit : commit.subject;
    const args = ['commit', '--quiet', '--allow-empty', '-m', subject];

    if (typeof commit !== 'string' && commit.body) {
      args.push('-m', commit.body);
    }

    run('git', args, repository);
  });

  return repository;
}

function runCli(repository, args = []) {
  return run(process.execPath, [CLI_PATH, ...args], repository);
}

function getDryRunVersion(repository, args = []) {
  const output = runCli(repository, ['--dry-run', ...args]);
  const match = output.match(/Would be updated to: v([^\s]+)/);

  if (!match) {
    throw new Error(`Could not find the dry-run version in output:\n${output}`);
  }

  return match[1];
}

afterEach(() => {
  temporaryRepositories.splice(0).forEach(repository => {
    fs.rmSync(repository, { recursive: true, force: true });
  });
});

describe('automatic bump detection through the CLI', () => {
  test.each([
    ['fix commit', ['fix: поправил'], [], '1.2.4'],
    ['fix and feat commits', ['fix: поправил', 'feat: новое'], [], '1.3.0'],
    ['scoped feat commit', ['feat(card): новый инпут'], [], '1.3.0'],
    ['scoped breaking feat commit', ['feat(card)!: убрал инпут'], [], '1.3.0'],
    ['footer-breaking fix commit', [{
      subject: 'fix(card): исправлено выравнивание футера',
      body: 'BREAKING CHANGE: удалён инпут showFooter, используйте слот'
    }], [], '1.3.0'],
    ['fix and footer-breaking fix commits', ['fix: мелочь', {
      subject: 'fix(modal): изменён API',
      body: 'BREAKING CHANGE: удалён метод openLegacy, используйте open'
    }], [], '1.3.0'],
    ['docs and chore commits', ['docs: readme', 'chore: зависимости'], [], '1.2.4'],
    ['no commits after the version tag', [], [], '1.2.4'],
    ['explicit major bump', ['fix: ...'], ['--release-as', 'major'], '2.0.0'],
    ['explicit minor bump', ['fix: ...'], ['--release-as', 'minor'], '1.3.0'],
    ['explicit patch bump', ['feat: ...'], ['--release-as', 'patch'], '1.2.4'],
    ['explicit version', ['feat: ...'], ['--release-as', '2.1.0'], '2.1.0'],
    ['prerelease bump', ['feat: ...'], ['--prerelease', 'beta'], '1.2.4-beta.0']
  ])('%s', (name, commits, args, expectedVersion) => {
    const repository = createRepository(commits);

    expect(getDryRunVersion(repository, args)).toBe(expectedVersion);
  });

  test('real release matches dry-run for a footer-breaking fix commit', () => {
    const repository = createRepository([{
      subject: 'fix(card): исправлено выравнивание футера',
      body: 'BREAKING CHANGE: удалён инпут showFooter, используйте слот'
    }]);
    const dryRunVersion = getDryRunVersion(repository);

    const releaseOutput = runCli(repository);
    const packageJson = JSON.parse(fs.readFileSync(path.join(repository, 'package.json'), 'utf8'));
    const changelog = fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8');

    expect(dryRunVersion).toBe('1.3.0');
    expect(releaseOutput).toContain('Released v1.3.0');
    expect(packageJson.version).toBe(dryRunVersion);
    expect(run('git', ['describe', '--tags', '--abbrev=0'], repository).trim()).toBe('v1.3.0');
    expect(changelog).toContain('### ⚠️ Breaking Changes');
    expect(changelog).toContain('удалён инпут showFooter, используйте слот');
    expect(changelog).toContain('### Fixes');
  });

  test('preserves a multiline breaking change footer', () => {
    const repository = createRepository([{
      subject: 'fix(card): изменён API футера',
      body: [
        'BREAKING CHANGE: удалён инпут showFooter, используйте слот',
        'Дополнительно удалён устаревший FooterService.',
        'Миграция требуется для всех карточек.'
      ].join('\n')
    }]);

    expect(getDryRunVersion(repository)).toBe('1.3.0');
    runCli(repository);

    const changelog = fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8');
    expect(changelog).toContain([
      '  удалён инпут showFooter, используйте слот',
      '  Дополнительно удалён устаревший FooterService.',
      '  Миграция требуется для всех карточек.'
    ].join('\n'));
  });

  test('detects a footer-breaking commit when invalid commits are not filtered', () => {
    const repository = createRepository([{
      subject: 'fix(card): изменён API футера',
      body: 'BREAKING CHANGE: удалён инпут showFooter, используйте слот'
    }], {
      ...VERSION_CONFIG,
      changelog: {
        ...VERSION_CONFIG.changelog,
        skipInvalidCommits: false
      }
    });

    expect(getDryRunVersion(repository)).toBe('1.3.0');
  });

  test('includes two footer-breaking commits in one minor release', () => {
    const repository = createRepository([
      {
        subject: 'fix(card): изменён API футера',
        body: 'BREAKING CHANGE: удалён инпут showFooter, используйте слот'
      },
      {
        subject: 'fix(modal): изменён API модалки',
        body: ['BREAKING CHANGE: удалён метод openLegacy.', 'Используйте open вместо него.'].join('\n')
      }
    ]);

    expect(getDryRunVersion(repository)).toBe('1.3.0');
    runCli(repository);

    const changelog = fs.readFileSync(path.join(repository, 'CHANGELOG.md'), 'utf8');
    expect(changelog.match(/### ⚠️ Breaking Changes/g)).toHaveLength(1);
    expect(changelog).toContain('изменён API футера');
    expect(changelog).toContain('удалён инпут showFooter, используйте слот');
    expect(changelog).toContain('изменён API модалки');
    expect(changelog).toContain('удалён метод openLegacy.');
  });
});
