const fs = require('fs');
const path = require('path');
const semver = require('semver');

function bumpVersionInFiles(config, cliArgs, customVersion, commits = []) {
    try {
        const filesToUpdate = getFilesToUpdate(config);
        const pkg = readPackageJson();
        const currentVersion = pkg.version;
        const newVersion = customVersion || calculateVersion(currentVersion, cliArgs, commits, config);

        updateFiles(filesToUpdate, newVersion);

        return { newVersion };
    } catch (error) {
        console.error('Version bump failed:', error.message);
        process.exit(1);
    }
}

function getFilesToUpdate(config) {
    if (!config) return ['package.json'];

    if (typeof config.files === 'string') {
        return [config.files];
    }

    if (Array.isArray(config.files)) {
        return config.files.filter(file => file && typeof file === 'string');
    }

    return ['package.json']; // fallback
}

function readPackageJson() {
    try {
        return JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    } catch (error) {
        throw new Error('Could not read package.json: ' + error.message);
    }
}

function updateFiles(files, newVersion) {
    files.forEach(file => {
        try {
            const filePath = path.resolve(file);
            let content = fs.readFileSync(filePath, 'utf-8');

            if (file.endsWith('.json')) {
                const json = JSON.parse(content);
                json.version = newVersion;
                content = JSON.stringify(json, null, 2);
            } else {
                content = content.replace(
                    /(version=["'])(\d+\.\d+\.\d+)(["'])/,
                    `$1${newVersion}$3`
                );
            }

            fs.writeFileSync(filePath, content);
        } catch (error) {
            console.warn(`⚠️ Could not update ${file}:`, error.message);
        }
    });
}

function detectBump(commits, config = {}) {
    const minorTypes = config.bumpTypes?.minor || ['feat', 'features', 'feature'];
    const typePattern = minorTypes.map(escapeRegex).join('|');
    const minorRegex = typePattern
        ? new RegExp(`^(${typePattern})(\\([^)]*\\))?!?:`)
        : null;

    return commits.some(commit => {
        const subject = getCommitSubject(commit);
        return isBreakingCommit(commit, subject) || minorRegex?.test(subject);
    }) ? 'minor' : 'patch';
}

function isBreakingCommit(commit, subject = getCommitSubject(commit)) {
    if (/^\w+(?:\([^)]*\))?!:/.test(subject)) {
        return true;
    }

    const body = typeof commit === 'string' ? subject : commit?.body || subject;
    return /(?:^|\r?\n)BREAKING[ -]CHANGE:\s*\S/.test(body);
}

function getCommitSubject(commit) {
    if (typeof commit === 'string') {
        if (/^\w+(?:\([^)]*\))?!?:/.test(commit)) {
            return commit;
        }

        const [, ...messageParts] = commit.split(' ');
        return messageParts.join(' ');
    }

    return commit?.subject || '';
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculateVersion(currentVersion, cliArgs, commits = [], config = {}) {
    const releaseAs = cliArgs['release-as'];
    const prerelease = cliArgs['prerelease'];
    if (['major', 'minor', 'patch'].includes(releaseAs)) {
        return semver.inc(currentVersion, releaseAs);
    }

    if (semver.valid(releaseAs)) {
        return releaseAs;
    }

    if (prerelease) {
        return semver.inc(currentVersion, 'prerelease', prerelease);
    }

    return semver.inc(currentVersion, detectBump(commits, config));
}

module.exports = {
    bumpVersionInFiles,
    calculateVersion,
    detectBump
};
