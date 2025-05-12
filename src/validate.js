const { execSync } = require('child_process');
const { defaultConfig } = require('./config');

function createCommitValidator(types) {
    const typePattern = types.map(t => t.type).join('|');
    const regex = new RegExp(`^(${typePattern})(\\(.+\\))?:`, 'g');

    return (commit) => regex.test(commit);
}

function filterValidCommits(config = defaultConfig) {
    const commits = execSync('git log --pretty=format:"%h %s"').toString().split('\n');
    const invalidCommits = [];

    const isValidCommit = createCommitValidator(config.changelog.types);

    const validCommits = commits.filter(commit => {
        const isValid = isValidCommit(commit);
        if (!isValid) invalidCommits.push(commit);
        return isValid;
    });

    if (invalidCommits.length > 0) {
        console.log('⚠️ Skipped invalid commits:');
        invalidCommits.forEach(c => console.log(`- ${c}`));
    }

    return validCommits;
}

module.exports = { filterValidCommits };