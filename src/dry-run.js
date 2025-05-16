const { execSync } = require('child_process');
const { filterValidCommits } = require('./validate');
const { defaultConfig } = require('./config');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

function pseudoBumpVersionInFiles(config, cliArgs, customVersion) {
  try {
    const filesToUpdate = getFilesToUpdate(config);
    const pkg = readPackageJson();
    const currentVersion = pkg.version;
    const pseudoNewVersion = customVersion || calculateVersion(currentVersion, cliArgs);
    const filesChanged = pseudoUpdateFiles(filesToUpdate, pseudoNewVersion, currentVersion);

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

  return ['package.json']; // fallback
}

function readPackageJson() {
  try {
    return JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  } catch (error) {
    throw new Error('Could not read package.json: ' + error.message);
  }
}

function pseudoUpdateFiles(files, newVersion, currentVersion) {
  return files.map(file => {
    return `📦[dry-run] File: ${file} from the current version ${currentVersion} would be updated to the version ${newVersion} `
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

function pseudoGenerateChangelog(newVersion, config) {
  const mergedConfig = { ...defaultConfig, ...config };
  const {
    changelog: {
      header = '# Changelog\n\n',
      types = [],
      skip = {},
      repositoryUrl,
      footer = '',
      skipInvalidCommits = true
    } = {},
    commits: prefilteredCommits
  } = mergedConfig;


  const currentDate = new Date().toISOString().split('T')[0];
  let oldContent = '';

  try {
    oldContent = fs.readFileSync(mergedConfig.changelogFile || 'CHANGELOG.md', 'utf-8');
  } catch (e) {
    console.log('🆕[dry-run] Create new CHANGELOG.md');
  }

  const commits = prefilteredCommits !== undefined
    ? prefilteredCommits
    : skipInvalidCommits
      ? filterValidCommits(mergedConfig)
      : execSync('git log --pretty=format:"%h %s"').toString().trim().split('\n');

  const groupedChanges = {};
  types.forEach(type => {
    groupedChanges[type.type] = {
      section: type.section,
      items: []
    };
  });

  if (!skipInvalidCommits) {
    groupedChanges.other = {
      section: 'Other Changes',
      items: []
    };
  }

  console.log('📝[dry-run] Commits:', commits);
  if (commits?.length) {
    commits.forEach(line => {
      const [hash, ...messageParts] = line.split(' ');
      const message = messageParts.join(' ');
      const match = message.match(/^(\w+)(?:\((.+)\))?:\s(.+)/);
      if (!match && !skipInvalidCommits) {
        // Невалидный коммит, но мы их не пропускаем
        groupedChanges.other.items.push(`- ${hash}: ${message}`);
        return;
      }

      if (!match) return; // Пропускаем невалидные коммиты

      const [, type, scope, desc] = match;
      const typeConfig = types.find(t => t.type === type);

      if (!typeConfig || skip[type]) return;

      const linkedMessage = repositoryUrl
          ? `[${hash}](${repositoryUrl}/commit/${hash}): ${desc.trim()}`
          : `${hash}: ${desc.trim()}`;
      if (groupedChanges[type]) {
        groupedChanges[type].items.push(`- ${linkedMessage}`);
      } else if (!skipInvalidCommits) {
        groupedChanges.other.items.push(`- ${linkedMessage}`);
      }
    });
  }

  // Формируем новую запись
  let newEntry = `## v${newVersion} (${currentDate})\n\n`;

  // Добавляем секции в CHANGELOG
  types.forEach(type => {
    if (groupedChanges[type.type]?.items.length > 0) {
      newEntry += `### ${groupedChanges[type.type].section}\n`;
      newEntry += groupedChanges[type.type].items.join('\n') + '\n\n';
    }
  });

  if (!skipInvalidCommits && groupedChanges.other?.items.length > 0) {
    newEntry += `### ${groupedChanges.other.section}\n`;
    newEntry += groupedChanges.other.items.join('\n') + '\n\n';
  }
  if (footer) {
    newEntry += `---\n${footer}\n`;
  }

  const newContent = header + newEntry + oldContent.replace(header, '');
  return newContent;

}

module.exports = {
  pseudoBumpVersionInFiles,
  pseudoGenerateChangelog
};
