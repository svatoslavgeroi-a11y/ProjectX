# flake8: noqa
# pylint: skip-file
import os
import sys
import json
import webbrowser
import subprocess

import spotify_api
import data_processor

def main():
    print("=" * 60)
    print("      ANTIGRAVITY SPOTIFY ANALYZER v1.0      ")
    print("=" * 60)
    
    # 1. Try fetching playlists from Spotify API
    playlist_mapping = {}
    sp = spotify_api.get_spotify_client()
    if sp:
        playlist_mapping = spotify_api.fetch_user_playlists_mapping(sp)
        if playlist_mapping:
            spotify_api.save_playlist_cache(playlist_mapping)
        else:
            print("[INFO] Spotify API returned error, trying local cache...")
            playlist_mapping = spotify_api.load_playlist_cache()
            if not playlist_mapping:
                playlist_mapping = spotify_api.extract_mapping_from_existing_html()
                if playlist_mapping:
                    spotify_api.save_playlist_cache(playlist_mapping)
    else:
        print("[INFO] Spotify authorization not available, loading local cache...")
        playlist_mapping = spotify_api.load_playlist_cache()
        if not playlist_mapping:
            playlist_mapping = spotify_api.extract_mapping_from_existing_html()
            if playlist_mapping:
                spotify_api.save_playlist_cache(playlist_mapping)

    # 2. Run data processor logic
    result = data_processor.process_spotify_data(playlist_mapping)
    if not result:
        print("[ERROR] No tracks to display in the report.")
        return

    valid_tracks = result['valid_tracks']
    avg_bpm = result['avg_bpm']
    avg_energy = result['avg_energy']
    avg_dance = result['avg_dance']
    avg_valence = result['avg_valence']
    dominant_vibe = result['dominant_vibe']
    months = result['months']
    artists_history_data = result['artists_history_data']
    monthly_tops = result.get('monthly_tops', {})
    top_tracks_history = result.get('top_tracks_history', [])
    vibe_dna = result.get('vibe_dna', {'bpm': [], 'energy': [], 'valence': []})

    username = "Пользователь"
    avatar_url = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
    profile_url = "#"

    # Pre-format percentage strings for 100% accurate presentation in the templates
    avg_energy_pct = f"{avg_energy:.0%}"
    avg_dance_pct = f"{avg_dance:.0%}"

    tracks_json = json.dumps(valid_tracks, ensure_ascii=False)
    months_json = json.dumps(months, ensure_ascii=False)
    artists_history_json = json.dumps(artists_history_data, ensure_ascii=False)
    monthly_tops_json = json.dumps(monthly_tops, ensure_ascii=False)
    top_tracks_history_json = json.dumps(top_tracks_history, ensure_ascii=False)
    vibe_bpm_json = json.dumps(vibe_dna['bpm'], ensure_ascii=False)
    vibe_energy_json = json.dumps(vibe_dna['energy'], ensure_ascii=False)
    vibe_valence_json = json.dumps(vibe_dna['valence'], ensure_ascii=False)
    achievements_json = json.dumps(result.get('achievements', {}), ensure_ascii=False)
    achievements_detailed_json = json.dumps(result.get('achievements_detailed', {}), ensure_ascii=False)
    history_tracks_json = json.dumps(result.get('history_tracks_map', {}), ensure_ascii=False)
    music_impulse_json = json.dumps(result.get('music_impulse', {"rockets": [], "stars": []}), ensure_ascii=False)
    artist_features_json = json.dumps(result.get('artist_features', {}), ensure_ascii=False)

    # 2.5 Parse weekly top charts
    weekly_top_data = {}
    weekly_filename = "weekly_top1.csv" if os.path.exists("weekly_top1.csv") else "weekly_top.csv"
    try:
        weekly_top_data = data_processor.parse_weekly_top(weekly_filename)
        print(f"[INFO] Successfully loaded weekly top from '{weekly_filename}'")
    except Exception as e:
        print(f"[WARNING] Could not parse {weekly_filename}: {e}")
    weekly_top_json = json.dumps(weekly_top_data, ensure_ascii=False)

    # 3. Print top 5 tracks to terminal
    print("\n[TOP 5 TRACKS IN TERMINAL]:")
    print("-" * 60)
    for track in valid_tracks[:5]:
        try:
            energy_val = track['energy'] if track['energy'] != 'N/A' else 0.5
            energy_stars = "*" * int(round(energy_val * 5))
            if not energy_stars: energy_stars = "o"
            camelot_info = f" | Camelot: {track['camelot_key']}" if track['camelot_key'] != 'N/A' else ""
            
            # Safe ASCII fallbacks for console output
            artist_safe = track['artist'].encode('ascii', errors='replace').decode('ascii')
            name_safe = track['name'].encode('ascii', errors='replace').decode('ascii')
            key_safe = track['key'].replace('♯', '#').replace('♭', 'b').encode('ascii', errors='replace').decode('ascii')
            
            print(f"Track: {artist_safe} - {name_safe}")
            bpm_str = f"{track['bpm']}" if track['bpm'] != 'N/A' else 'N/A'
            energy_str = f"{track['energy']:.2f}" if track['energy'] != 'N/A' else 'N/A'
            print(f"   BPM: {bpm_str} | Key: {key_safe}{camelot_info} | Energy: {energy_str} {energy_stars}")
            print("-" * 60)
        except Exception:
            pass
        
    print(f"\nAnalysis completed! Processed {len(valid_tracks)} tracks.")
    print("Generating interactive web report...")

    # 4. Render HTML template using Jinja2 with string-replacement fallback
    html_content = ""
    try:
        from jinja2 import Environment, FileSystemLoader
        env = Environment(loader=FileSystemLoader('templates'))
        template = env.get_template('dashboard.html')
        html_content = template.render(
            username=username,
            avatar_url=avatar_url,
            profile_url=profile_url,
            avg_bpm=avg_bpm,
            avg_energy_pct=avg_energy_pct,
            avg_dance_pct=avg_dance_pct,
            dominant_vibe=dominant_vibe,
            tracks_json=tracks_json,
            months_json=months_json,
            artists_history_json=artists_history_json,
            monthly_tops_json=monthly_tops_json,
            top_tracks_history_json=top_tracks_history_json,
            vibe_bpm_json=vibe_bpm_json,
            vibe_energy_json=vibe_energy_json,
            vibe_valence_json=vibe_valence_json,
            achievements_json=achievements_json,
            achievements_detailed_json=achievements_detailed_json,
            history_tracks_json=history_tracks_json,
            music_impulse_json=music_impulse_json,
            weekly_top_json=weekly_top_json,
            artist_features_json=artist_features_json,
            total_tracks=len(valid_tracks)
        )
        print("[TEMPLATE]: Used Jinja2 Environment")
    except ImportError:
        # Fallback to direct replacement if Jinja2 is not installed (offline/restricted envs)
        template_path = os.path.join("templates", "dashboard.html")
        with open(template_path, "r", encoding="utf-8") as f_temp:
            html_content = f_temp.read()
        
        replacements = {
            "{{ username }}": username,
            "{{ avatar_url }}": avatar_url,
            "{{ profile_url }}": profile_url,
            "{{ avg_bpm }}": str(avg_bpm),
            "{{ avg_energy_pct }}": avg_energy_pct,
            "{{ avg_dance_pct }}": avg_dance_pct,
            "{{ dominant_vibe }}": dominant_vibe,
            "{{ tracks_json }}": tracks_json,
            "{{ months_json }}": months_json,
            "{{ artists_history_json }}": artists_history_json,
            "{{ monthly_tops_json }}": monthly_tops_json,
            "{{ top_tracks_history_json }}": top_tracks_history_json,
            "{{ vibe_bpm_json }}": vibe_bpm_json,
            "{{ vibe_energy_json }}": vibe_energy_json,
            "{{ vibe_valence_json }}": vibe_valence_json,
            "{{ achievements_json }}": achievements_json,
            "{{ achievements_detailed_json }}": achievements_detailed_json,
            "{{ history_tracks_json }}": history_tracks_json,
            "{{ music_impulse_json }}": music_impulse_json,
            "{{ weekly_top_json }}": weekly_top_json,
            "{{ artist_features_json }}": artist_features_json,
            "{{ total_tracks }}": str(len(valid_tracks))
        }
        for k, v in replacements.items():
            html_content = html_content.replace(k, v)
        print("[TEMPLATE]: Used fallback manual engine (Jinja2 not found)")

    report_path = os.path.abspath("spotify_analysis.html")
    with open(report_path, "w", encoding="utf-8") as f_out:
        f_out.write(html_content)

    print(f"SUCCESS: Web report created at: {report_path}")
    print("Opening report in web browser...")

    file_url = "file:///" + report_path.replace('\\', '/')
    browser_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Mozilla Firefox\firefox.exe",
        r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
    ]
    
    opened = False
    if sys.platform == "win32":
        for path in browser_paths:
            if os.path.exists(path):
                try:
                    subprocess.Popen([path, file_url])
                    opened = True
                    break
                except Exception:
                    pass
                    
    if not opened:
        webbrowser.open(file_url)

if __name__ == "__main__":
    main()
