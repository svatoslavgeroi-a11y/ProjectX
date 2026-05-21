import json
import re

content = open('spotify_analysis.html', encoding='utf-8').read()
tracks = json.loads(re.search(r'const tracks\s*=\s*(\[.*?\]);', content).group(1))

out = []
search_terms = ['кент', 'пиво', 'бас', 'руинер', 'сатоши']

for t in tracks:
    name = t.get('name', '')
    artist = t.get('artist', '')
    if any(term in name.lower() or term in artist.lower() for term in search_terms):
        out.append(f"Track: {name} | Artist: {artist}")

with open('scratch/inspect_tracks_out.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print("Done! Output written to scratch/inspect_tracks_out.txt")
