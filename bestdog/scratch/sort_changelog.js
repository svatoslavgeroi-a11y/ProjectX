const fs = require('fs');

function sortChangelog(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Split by version headers using regex
    // We use a regex that matches the header and keeps the header in the results
    const regex = /^## \[(.*?)\]/gm;
    let match;
    const entries = [];
    let lastIndex = 0;
    let lastVersion = null;

    while ((match = regex.exec(content)) !== null) {
        if (lastVersion !== null) {
            entries.push({
                version: lastVersion,
                content: content.slice(lastIndex, match.index)
            });
        }
        lastVersion = match[1];
        lastIndex = match.index + match[0].length + match[1].length + 4; // approximate offset for the version and brackets
        // Wait, the regex.exec match.index points to the start of the match "## [version]"
        // Let's do it simpler.
    }
    
    // Manual split
    const parts = content.split(/^## \[/gm);
    const header = parts[0];
    const versionsAndContent = [];

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const versionMatch = part.match(/^(.*?)\]/);
        if (versionMatch) {
            const version = versionMatch[1];
            const entryContent = part.slice(version.length + 1);
            versionsAndContent.push({ version, entryContent });
        }
    }

    function versionToKey(v) {
        return v.split('.').map(x => parseInt(x, 10));
    }

    function compareVersions(a, b) {
        const keyA = versionToKey(a);
        const keyB = versionToKey(b);
        for (let i = 0; i < Math.max(keyA.length, keyB.length); i++) {
            const valA = keyA[i] || 0;
            const valB = keyB[i] || 0;
            if (valA !== valB) return valB - valA; // Descending
        }
        return 0;
    }

    versionsAndContent.sort((a, b) => compareVersions(a.version, b.version));

    let newContent = header;
    for (const entry of versionsAndContent) {
        newContent += `## [${entry.version}]${entry.entryContent}`;
    }

    fs.writeFileSync(filepath, newContent, 'utf8');
}

sortChangelog('CHANGELOG.md');
