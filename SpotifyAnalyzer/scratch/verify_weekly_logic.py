import re
import json

content = open('spotify_analysis.html', encoding='utf-8').read()

# Extract weeklyTop JSON
weekly_top_match = re.search(r'const weeklyTop\s*=\s*(\{.*?\});', content)
# Extract tracks JSON
tracks_match = re.search(r'const tracks\s*=\s*(\[.*?\]);', content)

if weekly_top_match and tracks_match:
    weekly_top = json.loads(weekly_top_match.group(1))
    tracks = json.loads(tracks_match.group(1))
    
    print("Successfully parsed JSON data from spotify_analysis.html!")
    print(f"Number of weeks: {len(weekly_top)}")
    print(f"Number of global tracks: {len(tracks)}")
    
    # Run the exact JS counting logic in Python
    artist_counts = {}
    song_counts = {}
    
    for week, data in weekly_top.items():
        artists_list = data.get('artists', [])
        tracks_list = data.get('tracks', [])
        
        # Count artists
        for art in artists_list:
            if not art or art == '—':
                continue
            clean_art = art.strip()
            # Clean playcount suffix like " - 2" or " - 1" from end of name if present
            clean_art = re.sub(r'\s*-\s*\d+$', '', clean_art).strip()
            if not clean_art:
                continue
            
            # Special normalization for KSB
            if clean_art.lower().startswith('ksb '):
                clean_art = 'KSB Music'
            
            # Use lower-case comparison to match JS case-insensitivity
            canonical_name = clean_art # Simple case for this script
            # In JS we check artistsHistory, let's just use cleaned name capitalized correctly
            if clean_art.lower() == 'radiohead':
                canonical_name = 'Radiohead'
            elif clean_art.lower() == 'the beatles':
                canonical_name = 'The Beatles'
            elif clean_art.lower() == 'rhcp':
                canonical_name = 'RHCP'
            elif clean_art.lower() == 'twenty one pilots':
                canonical_name = 'Twenty One Pilots'
            elif clean_art.lower() == 'лсп':
                canonical_name = 'ЛСП'
                
            artist_counts[canonical_name] = artist_counts.get(canonical_name, 0) + 1
            
        # Count songs
        for track in tracks_list:
            if not track or track == '—':
                continue
            clean_track = track.strip()
            clean_track = re.sub(r'\s*-\s*\d+$', '', clean_track).strip()
            if not clean_track:
                continue
            song_counts[clean_track] = song_counts.get(clean_track, 0) + 1
            
    # Sort
    sorted_artists = sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)
    sorted_songs = sorted(song_counts.items(), key=lambda x: x[1], reverse=True)
    
    print("\n--- CALCULATED TOP ARTISTS ---")
    for name, cnt in sorted_artists[:10]:
        print(f"{name}: {cnt} hits")
        
    print("\n--- CALCULATED TOP SONGS AND MATCHED ARTISTS ---")
    for name, cnt in sorted_songs[:12]:
        # Exact/Partial Match logic
        matched_artist = '—'
        exact_match = next((t for t in tracks if t['name'].lower() == name.lower()), None)
        if exact_match:
            matched_artist = exact_match['artist']
        else:
            partial_match = next((t for t in tracks if t['name'].lower() in name.lower() or name.lower() in t['name'].lower()), None)
            if partial_match:
                matched_artist = partial_match['artist']
                
        print(f"Track: '{name}' | Artist: '{matched_artist}' | Hits: {cnt}")
else:
    print("Failed to find weeklyTop or tracks inside the compiled html!")
