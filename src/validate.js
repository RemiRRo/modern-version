const { execSync } = require('child_process');
const { defaultConfig } = require('./config');

function createCommitValidator(types = []) {
  if (!Array.isArray(types)) {
    console.error('⚠️ Config Error: "types" must be an array. Using default types.');
    types = defaultConfig.changelog.types;
  }

  const typePattern = types
    .map(t => [t.type, ...(t.aliases || [])])
    .flat()
    .join('|');

  return new RegExp(`^(${typePattern})(?:\\([\\w-]+\\))?:\\s.+$`, 'u');
}

function filterValidCommits(config) {
  const mergedConfig = { ...defaultConfig, ...config };
  const commitValidator = createCommitValidator(mergedConfig.changelog?.types);

  const commits = execSync('git log --pretty=format:"%h %s"')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);



  const valid = commits.filter(commit => {
    const [hash, ...messageParts] = commit.split(' ');
    const message = messageParts.join(' ');
    return commitValidator.test(message);
  });

  if (valid.length === 0) {
    console.log('Last commits:');
    commits.slice(0, 5).forEach(c => console.log(`- ${c}`));
  }

  return valid;
}

module.exports = { filterValidCommits };
