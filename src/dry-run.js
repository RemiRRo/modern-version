const fs = require('fs');
const { calculateVersion } = require('./version-files');
const { buildChangelogContent } = require('./changelog');

const DRY_RUN_CHANGELOG_VERSION_LIMIT = 3;

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
  return limitChangelogPreview(buildChangelogContent(newVersion, config));
}

function limitChangelogPreview(content, versionLimit = DRY_RUN_CHANGELOG_VERSION_LIMIT) {
  if (!content || versionLimit <= 0) return '';

  const normalizedContent = content.replace(/\r\n/g, '\n').trimEnd();
  const firstVersionHeading = normalizedContent.match(/^##\s+v.+$/m);

  if (!firstVersionHeading) {
    return normalizedContent;
  }

  const header = normalizedContent.slice(0, firstVersionHeading.index).trimEnd();
  const versionEntries = normalizedContent
    .slice(firstVersionHeading.index)
    .split(/(?=^##\s+v.+$)/m)
    .map(entry => entry.trimEnd())
    .filter(Boolean)
    .slice(0, versionLimit)
    .join('\n\n');

  return [header, versionEntries].filter(Boolean).join('\n\n');
}

module.exports = {
  pseudoBumpVersionInFiles,
  pseudoGenerateChangelog,
  limitChangelogPreview
};
