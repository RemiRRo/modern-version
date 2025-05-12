const fs = require('fs');
const path = require('path');
const semver = require('semver');

function bumpVersionInFiles(config, cliArgs, customVersion) {
    try {
        const filesToUpdate = getFilesToUpdate(config);
        const pkg = readPackageJson();
        const currentVersion = pkg.version;
        const newVersion = customVersion || calculateVersion(currentVersion, cliArgs);

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

function calculateVersion(currentVersion, { prerelease, releaseAs }) {
    if (releaseAs) {
        if (!semver.valid(releaseAs)) {
            throw new Error(`Invalid version: ${releaseAs}`);
        }
        return releaseAs;
    }

    if (prerelease) {
        return semver.inc(currentVersion, 'prerelease', prerelease);
    }

    return semver.inc(currentVersion, 'patch');
}

module.exports = {
    bumpVersionInFiles,
    calculateVersion
};