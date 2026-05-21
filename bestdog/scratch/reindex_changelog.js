const fs = require('fs');

function reindexChangelog(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    
    const parts = content.split(/^## \[/gm);
    const header = parts[0];
    const entries = [];

    // Skip the header (parts[0])
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const firstBracketIndex = part.indexOf(']');
        const entryContent = part.slice(firstBracketIndex + 1);
        entries.push(entryContent);
    }

    // Now re-generate with new versions
    let newContent = header;
    let major = 4;
    let minor = 2;
    let patch = 5;

    for (let i = 0; i < entries.length; i++) {
        const version = `${major}.${minor}.${patch}`;
        newContent += `## [${version}]${entries[i]}`;
        
        patch--;
        if (patch < 0) {
            patch = 9;
            minor--;
            if (minor < 0) {
                minor = 9;
                major--;
            }
        }
    }

    fs.writeFileSync(filepath, newContent, 'utf8');
}

reindexChangelog('CHANGELOG.md');
