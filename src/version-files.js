const fs = require('fs');
const semver = require('semver');

function bumpVersionInFiles(config, cliArgs, customVersion) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    const newVersion = customVersion || calculateVersion(currentVersion, cliArgs);

    config.files.forEach(file => {
        let content = fs.readFileSync(file, 'utf-8');
        if (file.endsWith('.json')) {
            const json = JSON.parse(content);
            json.version = newVersion;
            content = JSON.stringify(json, null, 2);
        } else {
            content = content.replace(/(version=["'])(\d+\.\d+\.\d+)(["'])/, `$1${newVersion}$3`);
        }
        fs.writeFileSync(file, content);
    });

    return { newVersion };
}

function calculateVersion(currentVersion, { prerelease, releaseAs }) {
    if (releaseAs) return releaseAs;
    return prerelease
        ? semver.inc(currentVersion, 'prerelease', prerelease)
        : semver.inc(currentVersion, 'patch');
}

module.exports = { bumpVersionInFiles };