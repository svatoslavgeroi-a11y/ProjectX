# flake8: noqa
# pylint: skip-file
import os
import sys
import json
import re

CLIENT_ID = "6286e57e804047b2a29aa2dccaa28b9e"
CLIENT_SECRET = "4d6db88a059a4c24b56c92eae20c147b"
REDIRECT_URI = "http://127.0.0.1:8080/"
SCOPE = "user-library-read playlist-read-private playlist-read-collaborative"

def get_spotify_client():
    """Initializes the spotipy client with OAuth authentication. Returns None if spotipy is missing or auth fails."""
    try:
        import spotipy
        from spotipy.oauth2 import SpotifyOAuth
    except ImportError:
        print("\n[WARNING] Library 'spotipy' is not installed.")
        print("To match playlists, you can install it: pip install spotipy")
        return None
        
    client_id = CLIENT_ID
    client_secret = CLIENT_SECRET
    
    credentials_path = "spotify_credentials.json"
    if os.path.exists(credentials_path):
        try:
            with open(credentials_path, "r", encoding="utf-8") as f:
                creds = json.load(f)
                client_id = creds.get("client_id", CLIENT_ID)
                client_secret = creds.get("client_secret", CLIENT_SECRET)
                print(f"[INFO] Using personal credentials from '{credentials_path}'")
        except Exception as e:
            print(f"[WARNING] Error reading '{credentials_path}': {e}")
    else:
        print("[INFO] Personal spotify_credentials.json not found. Bypassing online auth to avoid rate limits and using local cache.")
        return None
            
    print("[INFO] Authorizing in Spotify...")
    try:
        auth_manager = SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=REDIRECT_URI,
            scope=SCOPE,
            open_browser=True
        )
        return spotipy.Spotify(auth_manager=auth_manager, retries=0, status_retries=0)
    except Exception as e:
        print(f"\n[WARNING] Failed to authorize in Spotify: {e}")
        if "429" in str(e) or "limit" in str(e).lower():
            print("\n[RATE LIMIT 429] Request limit exceeded on common developer key!")
            print("Create a `spotify_credentials.json` with personal credentials to bypass this.")
        return None

def fetch_user_playlists_mapping(sp):
    """Fetches all user playlists (except 'Баня') and maps (artist, track_name) -> list of playlist names."""
    mapping = {}
    try:
        print("[INFO] Fetching your playlists from Spotify...")
        playlists = []
        limit = 50
        offset = 0
        while True:
            try:
                response = sp.current_user_playlists(limit=limit, offset=offset)
            except Exception as e:
                print(f"[WARNING] Error fetching playlist list: {e}")
                break
            items = response.get('items', []) if response else []
            if not items:
                break
            playlists.extend(items)
            if len(items) < limit:
                break
            offset += limit
        
        print(f"[INFO] Playlists found in Spotify: {len(playlists)}")
        
        for playlist in playlists:
            if not playlist:
                continue
            playlist_name = playlist.get('name')
            if not playlist_name:
                continue
                
            playlist_id = playlist.get('id')
            print(f"  Scanning playlist: '{playlist_name}'...")
            
            track_limit = 100
            track_offset = 0
            while True:
                try:
                    track_response = sp.playlist_items(
                        playlist_id, 
                        limit=track_limit, 
                        offset=track_offset
                    )
                except Exception as e:
                    print(f"    [WARNING] Could not load tracks for '{playlist_name}': {e}")
                    if "429" in str(e) or "limit" in str(e).lower() or "retry" in str(e).lower():
                        print("[RATE LIMIT 429] Request limit exceeded. Switching to offline mode with already scanned playlists...")
                        return mapping
                    break
                items = track_response.get('items', []) if track_response else []
                for item in items:
                    if not item:
                        continue
                    track = item.get('track') or item.get('item')
                    if not track:
                        continue
                    track_name = track.get('name')
                    artists = track.get('artists', [])
                    if not track_name or not artists:
                        continue
                    
                    for artist_obj in artists:
                        if not artist_obj:
                            continue
                        artist_name = artist_obj.get('name')
                        if not artist_name:
                            continue
                        
                        key = (artist_name.lower().strip(), track_name.lower().strip())
                        if key not in mapping:
                            mapping[key] = []
                        if playlist_name not in mapping[key]:
                            mapping[key].append(playlist_name)
                
                next_url = track_response.get('next') if track_response else None
                if not next_url:
                    break
                track_offset += track_limit
                
        print(f"[SUCCESS] Playlist mapping built successfully! Indexed tracks: {len(mapping)}")
    except Exception as e:
        print(f"[WARNING] Error building playlist map: {e}")
    return mapping

def save_playlist_cache(mapping, filepath="playlists_cache.json"):
    try:
        # Convert tuple keys to string keys "artist || track"
        json_friendly = {}
        for (artist, track), playlists in mapping.items():
            json_friendly[f"{artist} || {track}"] = playlists
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_friendly, f, ensure_ascii=False, indent=4)
        print(f"[SUCCESS] Playlist mapping saved to local cache '{filepath}'!")
    except Exception as e:
        print(f"[WARNING] Could not save playlist cache: {e}")

def load_playlist_cache(filepath="playlists_cache.json"):
    mapping = {}
    if not os.path.exists(filepath):
        return mapping
    try:
        print(f"[INFO] Loading playlist mapping from local cache '{filepath}'...")
        with open(filepath, "r", encoding="utf-8") as f:
            json_friendly = json.load(f)
        for key_str, playlists in json_friendly.items():
            parts = key_str.split(" || ")
            if len(parts) == 2:
                mapping[(parts[0], parts[1])] = playlists
        print(f"[SUCCESS] Successfully loaded tracks from cache: {len(mapping)}")
    except Exception as e:
        print(f"[WARNING] Could not read playlist cache: {e}")
    return mapping

def extract_mapping_from_existing_html(html_path="spotify_analysis.html"):
    mapping = {}
    if not os.path.exists(html_path):
        return mapping
    try:
        print(f"[INFO] Extracting playlist mapping from existing report '{html_path}'...")
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Look for the tracks json block
        start_marker = "const tracks = "
        idx = content.find(start_marker)
        if idx != -1:
            start_idx = idx + len(start_marker)
            # Use raw_decode to parse the exact JSON array and handle any characters flawlessly
            decoder = json.JSONDecoder()
            try:
                tracks_data, _ = decoder.raw_decode(content[start_idx:].strip())
                for track in tracks_data:
                    artist = track.get('artist')
                    name = track.get('name')
                    playlists = track.get('playlists', [])
                    if artist and name and playlists:
                        mapping[(artist.lower().strip(), name.lower().strip())] = playlists
                print(f"[SUCCESS] Successfully restored tracks from report: {len(mapping)}")
            except json.JSONDecodeError as je:
                print(f"[WARNING] Error decoding JSON from HTML: {je}")
    except Exception as e:
        print(f"[WARNING] Could not restore data from HTML: {e}")
    return mapping
