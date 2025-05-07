const fs = require('fs');
const { execSync } = require('child_process');

function generateChangelog(newVersion, config) {
    const { header, types, skip, repositoryUrl, footer } = config.changelog || {};
    const currentDate = new Date().toISOString().split('T')[0];

    let oldContent = '';
    try {
        oldContent = fs.readFileSync(config.changelogFile || 'CHANGELOG.md', 'utf-8');
    } catch {}

    let newEntry = `## v${newVersion} (${currentDate})\n\n`;
    const commits = execSync('git log --pretty=format:"%h %s"').toString().split('\n');

    commits.forEach(line => {
        const [hash, ...message] = line.split(' ');
        const msg = message.join(' ');
        const match = msg.match(/^(\w+)(?:\((.+)\))?:(.+)/);
        if (!match) return;

        const [, type, scope, desc] = match;
        const typeConfig = types.find(t => t.type === type);
        if (!typeConfig || skip?.[type]) return;

        const linkedMsg = repositoryUrl
            ? `[${hash}](${repositoryUrl}/commit/${hash}): ${desc.trim()}`
            : desc.trim();
        newEntry += `- ${linkedMsg}\n`;
    });

    if (footer) newEntry += `\n---\n${footer}\n`;
    fs.writeFileSync(config.changelogFile || 'CHANGELOG.md', header + newEntry + oldContent.replace(header, ''));
}

module.exports = generateChangelog;