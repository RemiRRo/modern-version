const { execSync } = require('child_process');

function filterValidCommits() {
    const commits = execSync('git log --pretty=format:"%h %s"').toString().split('\n');
    const invalidCommits = [];

    const validCommits = commits.filter(commit => {
        const isValid = /^(feat|fix|chore|docs|style|refactor|perf|test)(\(.+\))?:/g.test(commit);
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