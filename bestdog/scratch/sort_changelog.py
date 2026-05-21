import re

def sort_changelog(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by version headers
    # Regex to match "## [version] - date" and capture the version
    blocks = re.split(r'(?m)^## \[(.*?)\]', content)
    
    header = blocks[0]
    versions_and_content = []
    
    for i in range(1, len(blocks), 2):
        version = blocks[i]
        # Content is the rest until the next version
        raw_content = blocks[i+1]
        versions_and_content.append((version, raw_content))

    # Sort versions in descending order
    def version_key(v):
        # Convert "4.2.5" to [4, 2, 5]
        return [int(x) for x in v.split('.')]

    sorted_entries = sorted(versions_and_content, key=lambda x: version_key(x[0]), reverse=True)

    # Reconstruct content
    new_content = header
    for version, content in sorted_entries:
        new_content += f"## [{version}]{content}"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    sort_changelog('CHANGELOG.md')
