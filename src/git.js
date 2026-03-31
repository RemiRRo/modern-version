// git.js
const { execFileSync } = require('child_process');

function commitChanges(version, config) {
    execFileSync('git', ['add', '-A'], { stdio: 'inherit' });

    let message = config.commitMessage || 'chore(release): v' + version;
    message = message.replace(/\{version\}/g, version);

    execFileSync('git', ['commit', '-m', message], { stdio: 'inherit' });
}

function tagVersion(version, config) {
    if (!config.skip?.tag) {
        execFileSync('git', ['tag', '-a', `v${version}`, '-m', `Version ${version}`], { stdio: 'inherit' });
    }
}

module.exports = { commitChanges, tagVersion };