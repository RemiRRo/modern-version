const { execSync } = require('child_process');

function commitChanges(version, config) {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "${config.commitMessage || 'chore(release): v' + version}"`, { stdio: 'inherit' });
}

function tagVersion(version, config) {
    if (!config.skip?.tag) {
        execSync(`git tag -a v${version} -m "Version ${version}"`, { stdio: 'inherit' });
    }
}

module.exports = { commitChanges, tagVersion };