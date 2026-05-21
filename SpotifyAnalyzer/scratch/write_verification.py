import re
import json

content = open('spotify_analysis.html', encoding='utf-8').read()

weekly_top_match = re.search(r'const weeklyTop\s*=\s*(\{.*?\});', content)
tracks_match = re.search(r'const tracks\s*=\s*(\[.*?\]);', content)

if weekly_top_match and tracks_match:
    weekly_top = json.loads(weekly_top_match.group(1))
    tracks = json.loads(tracks_match.group(1))
    
    artist_counts = {}
    song_counts = {}
    
    for week, data in weekly_top.items():
        artists_list = data.get('artists', [])
        tracks_list = data.get('tracks', [])
        
        for art in artists_list:
            if not art or art == '—':
                continue
            clean_art = art.strip()
            clean_art = re.sub(r'\s*-\s*\d+$', '', clean_art).strip()
            if not clean_art:
                continue
            if clean_art.lower().startswith('ksb '):
                clean_art = 'KSB Music'
            artist_counts[clean_art] = artist_counts.get(clean_art, 0) + 1
            
        for track in tracks_list:
            if not track or track == '—':
                continue
            clean_track = track.strip()
            clean_track = re.sub(r'\s*-\s*\d+$', '', clean_track).strip()
            if not clean_track:
                continue
                
            # Case-insensitive normalization using tracks database
            canonical_track = next((t['name'] for t in tracks if t['name'].lower() == clean_track.lower()), clean_track)
            
            song_counts[canonical_track] = song_counts.get(canonical_track, 0) + 1
            
    sorted_artists = sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)
    sorted_songs = sorted(song_counts.items(), key=lambda x: x[1], reverse=True)
    
    out = []
    out.append("--- VERIFIED TOP ARTISTS ---")
    for name, cnt in sorted_artists[:15]:
        out.append(f"{name}: {cnt} hits")
        
    out.append("\n--- VERIFIED TOP SONGS AND MATCHED ARTISTS ---")
    for name, cnt in sorted_songs[:20]:
        matched_artist = '—'
        exact_match = next((t for t in tracks if t['name'].lower() == name.lower()), None)
        if exact_match:
            matched_artist = exact_match['artist']
        else:
            partial_match = next((t for t in tracks if t['name'].lower() in name.lower() or name.lower() in t['name'].lower()), None)
            if partial_match:
                matched_artist = partial_match['artist']
        out.append(f"Track: '{name}' | Artist: '{matched_artist}' | Hits: {cnt}")
        
    with open('scratch/verification_results.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print("Verification results written to scratch/verification_results.txt successfully!")
else:
    print("Failed to find JSON matches.")
