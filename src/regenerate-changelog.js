const fs = require('fs');
const { execFileSync } = require('child_process');
const semver = require('semver');
const { defaultConfig } = require('./config');
const { buildChangelogEntry, getBreakingChangeDetails } = require('./changelog');
const { createCommitValidator, parseGitCommits } = require('./validate');

const GIT_LOG_FORMAT = '%h%x1f%B%x1e';
const SEMVER_PATTERN = '[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?';

function regenerateChangelog(config, { dryRun = false } = {}) {
  const mergedConfig = mergeConfig(config);
  const tags = getVersionTags();

  if (tags.length === 0) {
    throw new Error('No reachable semantic version tags found. Changelog was not changed.');
  }

  const entries = tags.map((tag, index) => {
    const previousTag = tags[index - 1];
    const range = previousTag ? `${previousTag.name}..${tag.name}` : tag.name;
    const commits = getCommitsForRange(range)
      .filter(commit => !isReleaseCommit(commit.subject, mergedConfig))
      .filter(commit => shouldIncludeCommit(commit, mergedConfig));

    return buildChangelogEntry(tag.version, { ...mergedConfig, commits }, tag.date);
  });

  const header = mergedConfig.changelog.header || '# Changelog\n\n';
  const content = header + entries.reverse().join('');
  const changelogFile = mergedConfig.changelogFile || 'CHANGELOG.md';

  if (!dryRun) {
    fs.writeFileSync(changelogFile, content);
  }

  return { content, changelogFile, tagCount: tags.length };
}

function getVersionTags() {
  const output = execFileSync(
    'git',
    ['tag', '--merged', 'HEAD', '--format=%(refname:short)%09%(creatordate:short)'],
    { encoding: 'utf8' }
  ).trim();

  if (!output) return [];

  const tagsByVersion = new Map();

  output.split(/\r?\n/).forEach(line => {
    const [name, date] = line.split('\t');
    const version = semver.valid(name.replace(/^v/, ''));

    if (!version) return;

    const existing = tagsByVersion.get(version);
    if (!existing || (!existing.name.startsWith('v') && name.startsWith('v'))) {
      tagsByVersion.set(version, { name, version, date });
    }
  });

  return [...tagsByVersion.values()].sort((a, b) => semver.compare(a.version, b.version));
}

function getCommitsForRange(range) {
  const output = execFileSync(
    'git',
    ['log', `--pretty=format:${GIT_LOG_FORMAT}`, range],
    { encoding: 'utf8' }
  );

  return parseGitCommits(output);
}

function shouldIncludeCommit(commit, config) {
  const skipInvalidCommits = config.changelog.skipInvalidCommits !== false;
  if (!skipInvalidCommits) return true;

  const validator = createCommitValidator(config.changelog.types);
  return validator.test(commit.subject) || isBreakingCommit(commit);
}

function isBreakingCommit(commit) {
  const hasBreakingMarker = /^\w+(?:\([\w-]+\))?!:\s.+$/u.test(commit.subject);
  return hasBreakingMarker || Boolean(getBreakingChangeDetails(commit.body || commit.subject));
}

function isReleaseCommit(subject, config) {
  const configuredTemplate = config.commitMessage || 'chore(release): v{version}';
  const configuredPattern = configuredTemplate
    .split('{version}')
    .map(escapeRegExp)
    .join(SEMVER_PATTERN);
  const conventionalRelease = new RegExp(`^chore\\(release\\):\\s*(?:release\\s+)?v?${SEMVER_PATTERN}$`);
  const legacyRelease = new RegExp(`^chore:\\s*release\\s+v?${SEMVER_PATTERN}$`);

  return new RegExp(`^${configuredPattern}$`).test(subject)
    || conventionalRelease.test(subject)
    || legacyRelease.test(subject);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mergeConfig(config = {}) {
  return {
    ...defaultConfig,
    ...config,
    changelog: {
      ...defaultConfig.changelog,
      ...(config.changelog || {})
    }
  };
}

module.exports = regenerateChangelog;
module.exports.getVersionTags = getVersionTags;
module.exports.isBreakingCommit = isBreakingCommit;
module.exports.isReleaseCommit = isReleaseCommit;
