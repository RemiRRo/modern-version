const { execSync } = require('child_process');
const { defaultConfig } = require('./config');

const COMMIT_FIELD_SEPARATOR = '\x1f';
const COMMIT_SEPARATOR = '\x1e';

function createCommitValidator(types = []) {
  if (!Array.isArray(types)) {
    console.error('⚠️ Config Error: "types" must be an array. Using default types.');
    types = defaultConfig.changelog.types;
  }

  const typePattern = types
    .map(t => [t.type, ...(t.aliases || [])])
    .flat()
    .join('|');

  return new RegExp(`^(${typePattern})(?:\\([\\w-]+\\))?!?:\\s.+$`, 'u');
}

function getLastVersionTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { stdio: 'pipe' })
        .toString()
        .trim();
  } catch (e) {
    return null; // если тегов ещё нет (первый релиз)
  }
}

function parseGitCommits(rawLog) {
  const raw = rawLog.toString().trim();
  if (!raw) return [];

  if (!raw.includes(COMMIT_FIELD_SEPARATOR)) {
    return raw.split('\n').filter(Boolean).map(line => parseLegacyCommitLine(line));
  }

  return raw
    .split(COMMIT_SEPARATOR)
    .map(record => record.trim())
    .filter(Boolean)
    .map(record => {
      const [hash, ...bodyParts] = record.split(COMMIT_FIELD_SEPARATOR);
      const body = bodyParts.join(COMMIT_FIELD_SEPARATOR).trim();
      const subject = body.split(/\r?\n/)[0].trim();
      return { hash: hash.trim(), subject, body };
    });
}

function parseLegacyCommitLine(line) {
  if (/^\w+(?:\([\w-]+\))?!?:\s.+$/.test(line)) {
    return { hash: '', subject: line, body: line };
  }

  const [hash, ...messageParts] = line.split(' ');
  const subject = messageParts.join(' ');
  return { hash, subject, body: subject };
}

function getCommitLogCommand(lastTag) {
  const range = lastTag ? ` ${lastTag}..HEAD` : '';
  return `git log --pretty=format:"%h%x1f%B%x1e"${range}`;
}

function getGitCommits(lastTag) {
  return parseGitCommits(execSync(getCommitLogCommand(lastTag)));
}

function filterValidCommits(config) {
  const mergedConfig = { ...defaultConfig, ...config };
  const commitValidator = createCommitValidator(mergedConfig.changelog?.types);

  const lastTag = getLastVersionTag();
  const commits = getGitCommits(lastTag);



  const valid = commits.filter(commit => {
    return commitValidator.test(commit.subject);
  });

  if (valid.length === 0) {
    console.log('Last commits:');
    commits.slice(0, 5).forEach(commit => console.log(`- ${commit.subject}`));
  }

  return valid;
}

module.exports = { filterValidCommits, getGitCommits, parseGitCommits, createCommitValidator };
