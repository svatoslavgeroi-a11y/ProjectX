import re
content = open('spotify_analysis.html', encoding='utf-8').read()
# Find keys in artistsHistory JSON
match = re.search(r'const artistsHistory\s*=\s*(\{.*?\});', content)
if match:
    keys = [k for k in re.findall(r'"([^"]+)"\s*:', match.group(1)) if 'ksb' in k.lower()]
    print('artistsHistory KSB keys:', keys)
else:
    print('artistsHistory not found')
