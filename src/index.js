const {execSync} = require('child_process'); // Добавляем импорт
const {loadConfig} = require('./config');
const {runHook} = require('./hooks');
const {bumpVersionInFiles} = require('./version-files');
const {pseudoBumpVersionInFiles, pseudoGenerateChangelog} = require('./dry-run');
const generateChangelog = require('./changelog');
const {commitChanges, tagVersion} = require('./git');
const {filterValidCommits} = require('./validate');

async function release(cliArgs) {
  const config = loadConfig();

  const commits = config.changelog.skipInvalidCommits
    ? filterValidCommits(config)
    : execSync('git log --pretty=format:"%h %s"')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);

  if (commits.length === 0 && !cliArgs['dry-run']) {
    execSync('git log --pretty=format:"%h %s"').toString().split('\n').forEach(c => console.log(`- ${c}`));
    process.exit(1);
  }

  await runHook('prerelease', config, cliArgs);
  const customVersion = await runHook('prebump', config, cliArgs);

  if (cliArgs['dry-run']) {
    const {pseudoNewVersion, filesChanged} = pseudoBumpVersionInFiles(config, cliArgs, customVersion);
    // --- logger only ---
    console.log(`🟦 [dry-run] Would be updated to: v${pseudoNewVersion}`);
    filesChanged.forEach(log => console.log(log))
    if (!cliArgs['skip-changelog']) {
      const changelogPreview = pseudoGenerateChangelog(pseudoNewVersion, {...config, commits});
      console.log('✅ [dry-run] What will be added to Changelog:');
      console.log(changelogPreview);
    }
    return;
  }

  const { newVersion } = bumpVersionInFiles(config, cliArgs, customVersion);


  await runHook('postbump', config, {newVersion});

  if (!cliArgs['skip-changelog']) {
    await runHook('prechangelog', config);
    generateChangelog(newVersion, {...config, commits}); // Передаём отфильтрованные коммиты
    await runHook('postchangelog', config);
  }


  await runHook('precommit', config);
  commitChanges(newVersion, config);
  await runHook('postcommit', config);

  await runHook('pretag', config);
  tagVersion(newVersion, config);
  await runHook('posttag', config);


  console.log(`🚀 Released v${newVersion}`);
}

module.exports = release;
