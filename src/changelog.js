const fs = require('fs');
const { filterValidCommits, getGitCommits } = require('./validate');
const { defaultConfig } = require('./config');

function buildChangelogContent(newVersion, config) {
    const mergedConfig = { ...defaultConfig, ...config };
    const header = mergedConfig.changelog?.header || '# Changelog\n\n';
    let oldContent = '';

    try {
      oldContent = fs.readFileSync(mergedConfig.changelogFile || 'CHANGELOG.md', 'utf-8');
    } catch (e) {
      // File doesn't exist yet
    }

    const newEntry = buildChangelogEntry(newVersion, mergedConfig);
    const normalizedOldContent = oldContent.replace(/\r\n/g, '\n');
    // Remove any top-level markdown heading + trailing blank lines at the start of the file.
    // This handles header changes in config and prevents duplication regardless of
    // what the previous header text was.
    const body = normalizedOldContent.replace(/^# .+\n+/gm, '');
    return header + newEntry + body;
}

function buildChangelogEntry(newVersion, config, releaseDate = new Date().toISOString().split('T')[0]) {
    const mergedConfig = { ...defaultConfig, ...config };
    const {
      changelog: {
        types = [],
        skip = {},
        repositoryUrl,
        footer = '',
        skipInvalidCommits = true
      } = {},
      commits: prefilteredCommits
    } = mergedConfig;

    const commits = prefilteredCommits !== undefined
      ? prefilteredCommits
      : skipInvalidCommits
        ? filterValidCommits(mergedConfig)
        : getGitCommits();

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

    const breakingChanges = [];

    commits.forEach(commit => {
        const parsedCommit = parseCommit(commit);
        if (!parsedCommit) return;

        const { hash, subject, body } = parsedCommit;
        const match = subject.match(/^(\w+)(?:\((.+)\))?(!)?:\s(.+)/);

        if (!match && !skipInvalidCommits) {
            groupedChanges.other.items.push(`- ${hash}: ${subject}`);
            return;
        }

        if (!match) return;

        const [, type, scope, breakingMarker, desc] = match;
        const typeConfig = types.find(t => t.type === type || t.aliases?.includes(type));

        if (skip[type] || (typeConfig && skip[typeConfig.type])) return;

        const linkedMessage = repositoryUrl
            ? `[${hash}](${repositoryUrl}/commit/${hash}): ${desc.trim()}`
            : `${hash}: ${desc.trim()}`;

        const breakingDetails = getBreakingChangeDetails(body);
        if (breakingMarker || breakingDetails) {
            breakingChanges.push(formatBreakingChange(hash, desc, breakingDetails, repositoryUrl));
        }

        if (typeConfig && groupedChanges[typeConfig.type]) {
            groupedChanges[typeConfig.type].items.push(`- ${linkedMessage}`);
        } else if (!skipInvalidCommits) {
            groupedChanges.other.items.push(`- ${linkedMessage}`);
        }
    });

    let newEntry = `## v${newVersion} (${releaseDate})\n\n`;

    if (breakingChanges.length > 0) {
        newEntry += '### ⚠️ Breaking Changes\n';
        newEntry += breakingChanges.join('\n') + '\n\n';
    }

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

    return newEntry;
}

function parseCommit(commit) {
    if (typeof commit === 'string') {
        const [hash, ...messageParts] = commit.split(' ');
        const subject = messageParts.join(' ');
        return { hash, subject, body: subject };
    }

    if (!commit || !commit.hash || !commit.subject) return null;

    return {
        hash: commit.hash,
        subject: commit.subject,
        body: commit.body || commit.subject
    };
}

function getBreakingChangeDetails(body) {
    const match = body.match(/(?:^|\n)BREAKING[ -]CHANGE:\s*([\s\S]*?)(?=\n[A-Z][A-Z -]+:\s|\n#{1,6}\s|$)/);
    return match ? match[1].trim() : '';
}

function formatBreakingChange(hash, description, details, repositoryUrl) {
    const summary = repositoryUrl
        ? `[${hash}](${repositoryUrl}/commit/${hash}): ${description.trim()}`
        : `${hash}: ${description.trim()}`;

    if (!details) {
        return `- ${summary}`;
    }

    return [
        `- **${summary}**`,
        '',
        indentMarkdown(details, '  ')
    ].join('\n');
}

function indentMarkdown(text, indent) {
    return text
        .split(/\r?\n/)
        .map(line => line ? `${indent}${line}` : '')
        .join('\n');
}

function generateChangelog(newVersion, config) {
    const content = buildChangelogContent(newVersion, config);
    fs.writeFileSync(config.changelogFile || 'CHANGELOG.md', content);
}

module.exports = generateChangelog;
module.exports.buildChangelogContent = buildChangelogContent;
module.exports.buildChangelogEntry = buildChangelogEntry;
module.exports.getBreakingChangeDetails = getBreakingChangeDetails;
