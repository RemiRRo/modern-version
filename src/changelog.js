const fs = require('fs');
const { execSync } = require('child_process');
const { filterValidCommits } = require('./validate');
const { defaultConfig } = require('./config');

function buildChangelogContent(newVersion, config) {
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
      // File doesn't exist yet
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

    commits.forEach(line => {
        const [hash, ...messageParts] = line.split(' ');
        const message = messageParts.join(' ');
        const match = message.match(/^(\w+)(?:\((.+)\))?:\s(.+)/);

        if (!match && !skipInvalidCommits) {
            groupedChanges.other.items.push(`- ${hash}: ${message}`);
            return;
        }

        if (!match) return;

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

    let newEntry = `## v${newVersion} (${currentDate})\n\n`;

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

    const normalizedOldContent = oldContent.replace(/\r\n/g, '\n');
    // Remove any top-level markdown heading + trailing blank lines at the start of the file.
    // This handles header changes in config and prevents duplication regardless of
    // what the previous header text was.
    const body = normalizedOldContent.replace(/^# .+\n+/gm, '');
    return header + newEntry + body;
}

function generateChangelog(newVersion, config) {
    const content = buildChangelogContent(newVersion, config);
    fs.writeFileSync(config.changelogFile || 'CHANGELOG.md', content);
}

module.exports = generateChangelog;
module.exports.buildChangelogContent = buildChangelogContent;
