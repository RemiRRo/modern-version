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
function getLastVersionTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { stdio: 'pipe' })
        .toString()
        .trim();
  } catch (e) {
    return null; // если тегов ещё нет (первый релиз)
  }
}

function filterValidCommits(config) {
  const mergedConfig = { ...defaultConfig, ...config };
  const commitValidator = createCommitValidator(mergedConfig.changelog?.types);

  const lastTag = getLastVersionTag();
  const gitLogCommand = lastTag
      ? `git log --pretty=format:"%h %s" ${lastTag}..HEAD` // commit after tag
      : 'git log --pretty=format:"%h %s"'; // all commits (If the tag is absent)

  const commits = execSync(gitLogCommand).toString().trim().split('\n').filter(Boolean);



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
