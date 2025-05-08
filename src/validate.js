// validate.js
const { execSync } = require('child_process');

function validateCommits() {
    const commits = execSync('git log --pretty=format:"%s"').toString().split('\n');
    const nonEmptyCommits = commits.filter(commit => commit.trim() !== '');
    const invalid = nonEmptyCommits.filter(commit => !/^(feat|fix|chore|docs|style|refactor|perf|test)(\(.+\))?:/g.test(commit));

    if (invalid.length > 0) {
        console.error('❌ Invalid commits:\n', invalid.join('\n'));
        process.exit(1);
    }
}

module.exports = { validateCommits };