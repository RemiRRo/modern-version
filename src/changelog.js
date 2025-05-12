const fs = require('fs');
const { execSync } = require('child_process');
const { filterValidCommits } = require('./validate');
const { defaultConfig } = require('./config');

function generateChangelog(newVersion, config) {
    const { changelog: {
        header,
        types,
        skip = {},
        repositoryUrl,
        footer = '',
        skipInvalidCommits
    } } = { ...defaultConfig, ...config };

    const currentDate = new Date().toISOString().split('T')[0];

    let oldContent = '';
    try {
        oldContent = fs.readFileSync(config.changelogFile || 'CHANGELOG.md', 'utf-8');
    } catch (e) {
        console.log('Creating new CHANGELOG.md');
    }

    const commits = skipInvalidCommits
        ? filterValidCommits()
        : execSync('git log --pretty=format:"%h %s"').toString().split('\n');

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
        const match = message.match(/^(\w+)(?:\((.+)\))?:(.+)/);

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
    fs.writeFileSync(config.changelogFile || 'CHANGELOG.md', newContent);
}

module.exports = generateChangelog;