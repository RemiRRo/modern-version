const fs = require('fs');
const { calculateVersion } = require('./version-files');
const { buildChangelogContent } = require('./changelog');

function pseudoBumpVersionInFiles(config, cliArgs, customVersion) {
  try {
    const filesToUpdate = getFilesToUpdate(config);
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    const pseudoNewVersion = customVersion || calculateVersion(currentVersion, cliArgs);
    const filesChanged = filesToUpdate.map(file =>
      `📦[dry-run] File: ${file} from the current version ${currentVersion} would be updated to the version ${pseudoNewVersion} `
    );

    return {pseudoNewVersion, filesChanged};
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

  return ['package.json'];
}

function pseudoGenerateChangelog(newVersion, config) {
  console.log('📝[dry-run] Commits:', config.commits);
  return buildChangelogContent(newVersion, config);
}

module.exports = {
  pseudoBumpVersionInFiles,
  pseudoGenerateChangelog
};
