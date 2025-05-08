const { loadConfig } = require('./config');
const { runHook } = require('./hooks');
const { bumpVersionInFiles } = require('./version-files');
const generateChangelog = require('./changelog');
const { commitChanges, tagVersion } = require('./git');
const { validateCommits } = require('./validate');

async function release(cliArgs) {
    const config = loadConfig();
    validateCommits();

    await runHook('prerelease', config, cliArgs);
    const customVersion = await runHook('prebump', config, cliArgs);
    const { newVersion } = bumpVersionInFiles(config, cliArgs, customVersion);

    await runHook('postbump', config, { newVersion });
    await runHook('prechangelog', config);
    generateChangelog(newVersion, config);
    await runHook('postchangelog', config);

    await runHook('precommit', config);
    commitChanges(newVersion, config);
    await runHook('postcommit', config);

    await runHook('pretag', config);
    tagVersion(newVersion, config);
    await runHook('posttag', config);

    console.log(`🚀 Released v${newVersion}`);
}

module.exports = release;