# flake8: noqa
# pylint: skip-file
import os
import csv
import re
import difflib

KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Manual spelling alias mappings to fix user typos in history.csv
ARTIST_ALIASES = {
    "bouevard depo": "Boulevard Depo",
    "boulevard depo": "Boulevard Depo",
    "boulvard depo": "Boulevard Depo",
    "davied bowie": "David Bowie",
    "deftnes": "Deftones",
    "(hed)p.e.": "(Hed) P.E.",
    "(hed) p.e.": "(Hed) P.E.",
    "hed p.e.": "(Hed) P.E.",
    "fun lovin criminals": "Fun Lovin' Criminals",
    "fun lovin' criminals": "Fun Lovin' Criminals",
    "morgenstern": "MORGENSHTERN",
    "led zepellin": "Led Zeppelin",
    "ksb muzic": "KSB Music",
    "ksb music": "KSB Music",
    "ksb muzic 3": "KSB Music",
    "ksb muzic 4": "KSB Music",
    "ksb music - 110\\8 - 13,75": "KSB Music",
    "ksb music - 162\\10 - 16,2": "KSB Music",
    "ksb music - 110/8 - 13,75": "KSB Music",
    "ksb music - 162/10 - 16,2": "KSB Music",
    "gone fludd": "GONE.Fludd",
    "tayler the creator": "Tyler, The Creator"
}

# Manual spelling alias mappings for track names to fix typos and variations in history.csv
TRACK_ALIASES = {
    "weird fishes": "Weird Fishes / Arpeggi",
    "weirs fishes": "Weird Fishes / Arpeggi",
    "weird fishes/arpeggi": "Weird Fishes / Arpeggi",
    "weird fishes/ arpeggi": "Weird Fishes / Arpeggi",
    
    "lover, you shoud've come over": "Lover, You Should've Come Over",
    "lover, you shoul've come over": "Lover, You Should've Come Over",
    
    "bitches broken heart": "bitches broken hearts",
    "bitches broken hearts": "bitches broken hearts",
    
    "chateau": "Chateau (Feel Alright)",
    "street spirit": "Street Spirit (Fade Out)",
    
    "stairway to heaven": "Stairway to Heaven - Remaster"
}

def normalize_string(s):
    """Fuzzily normalizes track names and artists for safe comparisons, ignoring common remaster tags and symbols."""
    if not s:
        return ""
    s = str(s).lower().strip()
    s = re.sub(r'\s*[\(\[][^\]\)]*(remaster|live|single|edit|version|mix|feat|ft\.)[^\]\)]*[\)\]]', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\s*-\s*[^-\n]*(remaster|live|single|edit|version|mix|feat|ft\.)[^\-\n]*$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\s*-\s*\d{4}\s*remaster.*$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\s*-\s*remastered\s*\d{4}.*$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'\s*-\s*\d{4}\s*$', '', s)
    s = re.sub(r'\s*\(\d{4}\)\s*$', '', s)
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def classify_vibe(features):
    """Classifies a track vibe based on its audio features."""
    if not features:
        return "Неизвестно"
    
    energy = features.get('energy', 0)
    valence = features.get('valence', 0)
    danceability = features.get('danceability', 0)
    acousticness = features.get('acousticness', 0)
    instrumentalness = features.get('instrumentalness', 0)
    
    if instrumentalness > 0.5:
        return "Focus"
    elif energy > 0.75 and danceability > 0.7:
        return "Party"
    elif energy > 0.6:
        return "Energetic"
    elif acousticness > 0.7 and valence > 0.5:
        return "Chill"
    elif energy < 0.4 and valence < 0.4:
        return "Melancholic"
    elif valence > 0.75:
        return "Happy"
    else:
        return "Balanced"

def get_musical_key(key_num, mode_num):
    """Converts pitch key and mode number to readable key name."""
    if key_num == -1 or key_num is None:
        return "Неизвестно"
    key_name = KEY_NAMES[key_num]
    mode_name = "Мажор" if mode_num == 1 else "Минор"
    return f"{key_name} {mode_name}"

def get_camelot_key(key_num, mode_num):
    """Converts raw key number and mode number to Camelot key (e.g. 8A, 11B)."""
    if key_num == -1 or key_num is None or mode_num is None:
        return "N/A"
    
    major_camelot = ['8B', '3B', '10B', '5B', '12B', '7B', '2B', '9B', '4B', '11B', '6B', '1B']
    minor_camelot = ['5A', '12A', '7A', '2A', '9A', '4A', '11A', '6A', '1A', '8A', '3A', '10A']
    
    try:
        if mode_num == 1:
            return major_camelot[key_num]
        else:
            return minor_camelot[key_num]
    except IndexError:
        return "N/A"

def safe_float_pct(value, default=0.0):
    """Safely converts percentage string/number from CSV (0-100) to float (0.0-1.0)."""
    if value is None:
        return default
    try:
        return float(value) / 100.0
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0):
    """Safely converts value to integer."""
    if value is None:
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default

def parse_csv_key_to_display(csv_key):
    """Converts CSV key string (e.g. 'E minor', 'A#/B♭') to readable Russian key name (e.g. 'E Минор', 'A#/B♭ Мажор')."""
    if not csv_key:
        return "Неизвестно"
    
    clean_key = str(csv_key).strip()
    is_minor = False
    
    if 'minor' in clean_key.lower():
        is_minor = True
        clean_key = clean_key.lower().replace('minor', '').strip()
    elif 'm' in clean_key.lower() and not any(x in clean_key.lower() for x in ['major', 'flat', 'sharp']):
        is_minor = True
        if clean_key.lower().endswith('m'):
            clean_key = clean_key[:-1].strip()
            
    parts = []
    for p in clean_key.split('/'):
        p = p.strip()
        if len(p) > 0:
            parts.append(p[0].upper() + p[1:] if len(p) > 1 else p.upper())
    clean_key = "/".join(parts)
    
    mode_name = "Минор" if is_minor else "Мажор"
    return f"{clean_key} {mode_name}"

def calculate_artist_achievements(history, total_months):
    """
    Analyzes artist history and assigns achievements based on their chart records.
    Achievements:
    1. 👑 'Король камбэков' (King of Comebacks) - had a month with a high rank (<= 20, non-penalty),
       followed by at least one month of complete absence (penalty), followed by a return to Top-20 (<= 20, non-penalty).
    2. ⚡ 'Чудо одного хита' (One-Hit Wonder) - active in charts exactly 1 month, and peak rank in that month was 1.
    3. 🛡️ 'Стабильный ветеран' (Stable Veteran) - present in all months (active_months == total_months),
       consistently in the Top-30 (all ranks <= 30), and never occupied 1st place in any month.
    4. 🔥 'Абсолютный Доминатор' (Absolute Dominator) - occupied 1st place in 3 or more months in total.
    5. ⛰️ 'Царь Горы' (King of the Hill) - held 1st place for 3 or more consecutive months.
    6. ☄️ 'Яркая Комета' (Bright Comet) - active in exactly 1 or 2 months, peak rank <= 10, and never reached 1st place.
    """
    achievements = []
    
    # Active months list (non-penalty, non-null ranks)
    active_months = [h for h in history if h.get("rank") is not None and not h.get("penalty", False)]
    ranks = [h["rank"] for h in active_months]
    
    # 1. Король камбэков
    n = len(history)
    king_of_comebacks = False
    for i in range(n):
        h_i = history[i]
        if h_i.get("rank") is not None and h_i["rank"] <= 20 and not h_i.get("penalty", False):
            for j in range(i + 1, n):
                h_j = history[j]
                if h_j.get("penalty", False) or h_j.get("rank") is None:
                    for k in range(j + 1, n):
                        h_k = history[k]
                        if h_k.get("rank") is not None and h_k["rank"] <= 20 and not h_k.get("penalty", False):
                            king_of_comebacks = True
                            break
                if king_of_comebacks:
                    break
        if king_of_comebacks:
            break
            
    if king_of_comebacks:
        achievements.append("Король камбэков")
        
    # 2. Чудо одного хита
    if len(active_months) == 1:
        if ranks[0] == 1:
            achievements.append("Чудо одного хита")
            
    # 3. Стабильный ветеран
    if len(active_months) == total_months:
        all_top_30 = all(r <= 30 for r in ranks)
        no_first_place = all(r != 1 for r in ranks)
        if all_top_30 and no_first_place:
            achievements.append("Стабильный ветеран")
            
    # 4. Абсолютный Доминатор
    first_places = sum(1 for r in ranks if r == 1)
    if first_places >= 3:
        achievements.append("Абсолютный Доминатор")
        
    # 5. Царь Горы
    consec_first = 0
    max_consec_first = 0
    for h in history:
        if h.get("rank") == 1 and not h.get("penalty", False):
            consec_first += 1
            if consec_first > max_consec_first:
                max_consec_first = consec_first
        else:
            consec_first = 0
    if max_consec_first >= 3:
        achievements.append("Царь Горы")
        
    # 6. Яркая Комета
    if 1 <= len(active_months) <= 2:
        peak_rank = min(ranks) if ranks else 99
        if peak_rank <= 10 and 1 not in ranks:
            achievements.append("Яркая Комета")
            
    return achievements

def calculate_artist_achievements_detailed(artist, history, total_months, months):
    """
    Calculates dynamic details for all achievements obtained by the artist.
    """
    detailed = []
    
    active_months = [h for h in history if h.get("rank") is not None and not h.get("penalty", False)]
    active_indices = [idx for idx, h in enumerate(history) if h.get("rank") is not None and not h.get("penalty", False)]
    ranks = [h["rank"] for h in active_months]
    
    # 1. Король камбэков
    n = len(history)
    comeback_indices = []
    for k in range(n):
        h_k = history[k]
        if h_k.get("rank") is not None and h_k["rank"] <= 20 and not h_k.get("penalty", False):
            has_comeback = False
            for j in range(k):
                h_j = history[j]
                if h_j.get("penalty", False) or h_j.get("rank") is None:
                    for i in range(j):
                        h_i = history[i]
                        if h_i.get("rank") is not None and h_i["rank"] <= 20 and not h_i.get("penalty", False):
                            has_comeback = True
                            break
                if has_comeback:
                    break
            if has_comeback:
                comeback_indices.append(k)
                
    if comeback_indices:
        comeback_desc = []
        for idx in comeback_indices:
            month_name = months[idx]
            rank_val = history[idx]["rank"]
            comeback_desc.append(f"{month_name} (место {rank_val})")
        detailed.append({
            "artist": artist,
            "title": "Король камбэков",
            "icon": "fas fa-crown",
            "class": "king-comeback",
            "description": "Артист занимал высокие позиции в Топ-20, затем полностью покидал чарты, но совершил грандиозный камбэк обратно в Топ-20!",
            "details": f"Камбэк зафиксирован в: {', '.join(comeback_desc)}"
        })
        
    # 2. Чудо одного хита
    if len(active_months) == 1:
        if ranks[0] == 1:
            month_name = months[active_indices[0]]
            detailed.append({
                "artist": artist,
                "title": "Чудо одного хита",
                "icon": "fas fa-bolt",
                "class": "one-hit",
                "description": "Артист ворвался в чарты всего на один месяц за всю историю, но сразу занял абсолютное 1-е место!",
                "details": f"Событие произошло в месяце: {month_name} (1-е место)"
            })
            
    # 3. Стабильный ветеран
    if len(active_months) == total_months:
        all_top_30 = all(r <= 30 for r in ranks)
        no_first_place = all(r != 1 for r in ranks)
        if all_top_30 and no_first_place:
            first_month = months[0]
            last_month = months[-1]
            detailed.append({
                "artist": artist,
                "title": "Стабильный ветеран",
                "icon": "fas fa-shield-alt",
                "class": "stable-vet",
                "description": "Артист показал железную дисциплину: присутствовал во всех чартах без исключения, всегда держался в Топ-30, но ни разу не занимал 1-е место.",
                "details": f"Абсолютная стабильность на всей дистанции с {first_month} по {last_month}."
            })
            
    # 4. Абсолютный Доминатор
    first_place_months = [months[idx] for idx, h in enumerate(history) if h.get("rank") == 1 and not h.get("penalty", False)]
    if len(first_place_months) >= 3:
        detailed.append({
            "artist": artist,
            "title": "Абсолютный Доминатор",
            "icon": "fas fa-fire",
            "class": "absolute-dominator",
            "description": "Артист буквально подмял под себя чарты, оккупировав 1-е место в 3 или более месяцах за всю историю!",
            "details": f"1-е место завоевано в: {', '.join(first_place_months)} (всего {len(first_place_months)} раз)"
        })
        
    # 5. Царь Горы
    consec_runs = []
    current_run = []
    for idx, h in enumerate(history):
        if h.get("rank") == 1 and not h.get("penalty", False):
            current_run.append(months[idx])
        else:
            if len(current_run) >= 3:
                consec_runs.append(list(current_run))
            current_run = []
    if len(current_run) >= 3:
        consec_runs.append(list(current_run))
        
    if consec_runs:
        flat_months = [f"[{' ➔ '.join(run)}]" for run in consec_runs]
        detailed.append({
            "artist": artist,
            "title": "Царь Горы",
            "icon": "fas fa-mountain",
            "class": "king-of-hill",
            "description": "Невероятная выносливость на вершине: удерживал абсолютное 1-е место в чартах 3 или более месяцев подряд!",
            "details": f"Серии доминирования: {', '.join(flat_months)}"
        })
        
    # 6. Яркая Комета
    if 1 <= len(active_months) <= 2:
        peak_rank = min(ranks) if ranks else 99
        if peak_rank <= 10 and 1 not in ranks:
            comet_months = [f"{months[idx]} (место {history[idx]['rank']})" for idx in active_indices]
            detailed.append({
                "artist": artist,
                "title": "Яркая Комета",
                "icon": "fas fa-meteor",
                "class": "comet-artist",
                "description": "Яркая вспышка: пробыл в чартах крайне недолго (не более 2 месяцев), но успел стремительно влететь в Топ-10!",
                "details": f"Появление зафиксировано в: {', '.join(comet_months)}"
            })
            
    return detailed

def process_spotify_data(playlist_mapping=None):
    """Parses all CSV databases, links mappings, and calculates the complete analytics."""
    valid_tracks = []
    
    playlist_lookup = {}
    if playlist_mapping:
        for (art, trk), playlists in playlist_mapping.items():
            clean_key = re.sub(r'[^a-zа-яё0-9]', '', f"{art}{trk}".lower())
            playlist_lookup[clean_key] = playlists

    # 1. Load banya.csv as the donor database
    donor_path = "banya.csv"
    donor_map = {}
    if os.path.exists(donor_path):
        try:
            print(f"[INFO] Loading donor database '{donor_path}' for audio features...")
            with open(donor_path, mode='r', encoding='utf-8', errors='replace') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Song', row.get('Track Name', '')).strip()
                    artist = row.get('Artist', row.get('Artist Name(s)', '')).strip()
                    if name and artist:
                        norm_key = (normalize_string(name), normalize_string(artist))
                        bpm = safe_int(row.get('BPM', 0))
                        energy = safe_float_pct(row.get('Energy', 0))
                        camelot = row.get('Camelot', 'N/A').strip()
                        donor_map[norm_key] = {
                            'bpm': bpm,
                            'energy': energy,
                            'camelot_key': camelot
                        }
            print(f"[SUCCESS] Donor database loaded. Indexed tracks: {len(donor_map)}")
        except Exception as e:
            print(f"[WARNING] Error reading donor database '{donor_path}': {e}")
    else:
        print(f"[WARNING] Donor database '{donor_path}' not found. Tracks will not be enriched.")

    # 2. Load vse_pesni.csv as the main tracks database
    main_csv_path = "vse_pesni.csv"
    if not os.path.exists(main_csv_path):
        print(f"[ERROR] Main file '{main_csv_path}' not found in the project folder!")
        return None
        
    print(f"[INFO] Loading main tracks archive from '{main_csv_path}'...")
    try:
        with open(main_csv_path, mode='r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            seen_tracks = set()
            count = 0
            for row in reader:
                name = row.get('Song', row.get('Track Name', 'Неизвестный трек')).strip()
                if "father stretch my hands" in name.lower():
                    name = name.replace("hands", "Hands").replace("Hands", "Hands")
                artist = row.get('Artist', row.get('Artist Name(s)', 'Неизвестный артист')).strip()
                album = row.get('Album', 'Неизвестный альбом').strip()
                track_id = row.get('Spotify Track Id', row.get('Track ID', ''))
                
                norm_key = (normalize_string(name), normalize_string(artist))
                if norm_key in seen_tracks:
                    continue
                seen_tracks.add(norm_key)
                
                popularity = safe_int(row.get('Popularity', 0))
                danceability = safe_float_pct(row.get('Dance', 0))
                valence = safe_float_pct(row.get('Valence', 0))
                acousticness = safe_float_pct(row.get('Acoustic', 0))
                instrumentalness = safe_float_pct(row.get('Instrumental', 0))
                
                added_at = row.get('Added At', '').strip()
                if not added_at or added_at.lower() in ['nat', 'nan', 'null', 'none', 'unknown']:
                    added_at = 'Неизвестно'
                
                if norm_key in donor_map:
                    bpm = donor_map[norm_key]['bpm']
                    energy = donor_map[norm_key]['energy']
                    camelot_key = donor_map[norm_key]['camelot_key']
                else:
                    bpm = 'N/A'
                    energy = 'N/A'
                    camelot_key = 'N/A'
                
                genres = row.get('Genres', '')
                spotify_url = f"https://open.spotify.com/track/{track_id}" if track_id else f"https://open.spotify.com/search/{artist}%20{name}"
                csv_key = row.get('Key', '')
                display_key = parse_csv_key_to_display(csv_key) if csv_key else 'N/A'
                
                features = {
                    'energy': energy if energy != 'N/A' else 0.5,
                    'valence': valence,
                    'danceability': danceability,
                    'acousticness': acousticness,
                    'instrumentalness': instrumentalness
                }
                vibe = classify_vibe(features)
                
                playlists_found = []
                if playlist_mapping:
                    clean_csv_key = re.sub(r'[^a-zа-яё0-9]', '', f"{artist}{name}".lower())
                    if clean_csv_key in playlist_lookup:
                        playlists_found = playlist_lookup[clean_csv_key]
                    else:
                        for single_art in artist.split(','):
                            alt_key = re.sub(r'[^a-zа-яё0-9]', '', f"{single_art}{name}".lower())
                            if alt_key in playlist_lookup:
                                playlists_found = playlist_lookup[alt_key]
                                break
                
                track_info = {
                    'id': track_id if track_id else f"local_{count}",
                    'name': name,
                    'artist': artist,
                    'album': album,
                    'album_art': 'N/A',
                    'spotify_url': spotify_url,
                    'preview_url': None,
                    'popularity': popularity,
                    'bpm': bpm,
                    'key': display_key,
                    'camelot_key': camelot_key,
                    'energy': energy,
                    'danceability': danceability,
                    'valence': valence,
                    'acousticness': acousticness,
                    'instrumentalness': instrumentalness,
                    'vibe': vibe,
                    'genres': genres,
                    'playlists': playlists_found,
                    'added_at': added_at
                }
                valid_tracks.append(track_info)
                count += 1
        print(f"[SUCCESS] Successfully processed unique tracks from vse_pesni.csv: {len(valid_tracks)}")
    except Exception as e:
        print(f"[ERROR] Error reading vse_pesni.csv: {e}")
        return None

    # 3. Load history.csv and process historical stats
    history_path = "history.csv"
    months = []
    artist_tops = []
    track_tops = []
    artists_history_data = {}
    monthly_tops = {}
    bpm_history = []
    energy_history = []
    valence_history = []
    history_tracks_map = {}
    canonical_artists = {}
    
    if os.path.exists(history_path):
        try:
            print(f"[INFO] Loading personal history from '{history_path}'...")
            try:
                with open(history_path, mode='r', encoding='utf-8') as f:
                    reader = list(csv.reader(f, delimiter=';'))
            except UnicodeDecodeError:
                print("[WARNING] Could not read history.csv in UTF-8. Trying CP1251 fallback...")
                with open(history_path, mode='r', encoding='cp1251') as f:
                    reader = list(csv.reader(f, delimiter=';'))
            if reader:
                num_cols = len(reader[0])
                for col_idx in range(0, num_cols, 4):
                    month_name = reader[0][col_idx].strip()
                    if not month_name:
                        continue
                    months.append(month_name)
                    
                    m_artists = []
                    m_raw_artists = []
                    m_tracks = []
                    m_genres = []
                    
                    # 1. Parse tracks and genres (rows 2 to 51)
                    for row_idx in range(2, 52):
                        if row_idx >= len(reader):
                            break
                        row = reader[row_idx]
                        
                        trk_val = row[col_idx].strip() if col_idx < len(row) else ""
                        genre_val = row[col_idx + 2].strip() if col_idx + 2 < len(row) else ""
                        
                        if trk_val.lower() in ["трек", "название трека", "track"]:
                            trk_val = ""
                        if genre_val.lower() in ["жанр", "genre"]:
                            genre_val = ""
                            
                        if not trk_val:
                            trk_val = "—"
                        if not genre_val:
                            genre_val = "—"
                            
                        if trk_val != "—":
                            if "father stretch my hands" in trk_val.lower():
                                trk_val = trk_val.replace("hands", "Hands")
                            m_tracks.append(trk_val)
                        else:
                            m_tracks.append("—")
                        m_genres.append(genre_val)
                        
                    # 2. Parse artists (rows 0 to 49)
                    for row_idx in range(0, 50):
                        if row_idx >= len(reader):
                            break
                        row = reader[row_idx]
                        art_val = row[col_idx + 1].strip() if col_idx + 1 < len(row) else ""
                        
                        if art_val.lower() in ["исполнитель", "artist"]:
                            art_val = ""
                            
                        if not art_val:
                            art_val = "—"
                            
                        if art_val != "—":
                            art_val = re.sub(r'\s+', ' ', art_val).strip()
                            lower_art = art_val.lower()
                            if lower_art in ARTIST_ALIASES:
                                resolved_art = ARTIST_ALIASES[lower_art]
                                lower_art = resolved_art.lower()
                                art_val = resolved_art
                                
                            if lower_art not in canonical_artists:
                                canonical_artists[lower_art] = art_val
                            else:
                                existing = canonical_artists[lower_art]
                                if sum(1 for c in art_val if c.isupper()) > sum(1 for c in existing if c.isupper()):
                                    canonical_artists[lower_art] = art_val
                                    
                            m_artists.append(lower_art)
                            m_raw_artists.append(art_val)
                        else:
                            m_artists.append("—")
                            m_raw_artists.append("—")
                            
                    artist_tops.append(m_artists)
                    track_tops.append(m_tracks)
                    
                    m_data = []
                    for i in range(len(m_tracks)):
                        m_data.append({
                            "track": m_tracks[i],
                            "artist": m_raw_artists[i] if i < len(m_raw_artists) else "—",
                            "genre": m_genres[i] if i < len(m_genres) else "—"
                        })
                    monthly_tops[month_name] = m_data
                    
            print(f"[SUCCESS] Successfully processed history months: {len(months)} ({', '.join(months)})")
            
            # Calculate dynamic math for Artists
            unique_artists = set()
            for top in artist_tops:
                for art_lower in top:
                    if art_lower and art_lower != "—":
                        unique_artists.add(art_lower)
                    
            for artist_lower in sorted(unique_artists):
                artist = canonical_artists.get(artist_lower, artist_lower)
                
                m_debut = -1
                for m_idx, top in enumerate(artist_tops):
                    found_idx = -1
                    for idx, a in enumerate(top):
                        if a == artist_lower:
                            found_idx = idx
                            break
                    if found_idx != -1:
                        m_debut = m_idx
                        break
                
                if m_debut == -1:
                    continue
                ranks = []
                ranks_to_average = []
                for m_idx in range(len(months)):
                    if m_idx < m_debut:
                        ranks.append({
                            "rank": None,
                            "penalty": False
                        })
                    else:
                        top = artist_tops[m_idx]
                        found_idx = -1
                        for idx, a in enumerate(top):
                            if a == artist_lower:
                                found_idx = idx
                                break
                        if found_idx != -1:
                            rank_val = found_idx + 1
                            ranks.append({
                                "rank": rank_val,
                                "penalty": False
                            })
                            ranks_to_average.append(rank_val)
                        else:
                            rank_val = 51 # Rule +1, they occupied 51st position in absent months
                            ranks.append({
                                "rank": rank_val,
                                "penalty": True
                            })
                            ranks_to_average.append(rank_val)
                        
                avg_rank = sum(ranks_to_average) / len(ranks_to_average) if ranks_to_average else 51.0
                artists_history_data[artist] = {
                    "name": artist,
                    "debut_month": m_debut,
                    "history": ranks,
                    "avg_rank": round(avg_rank, 2)
                }

            # 4. Fuzzy matching history tracks to vse_pesni
            def match_history_track(h_track, unique_pesni):
                h_track_clean = h_track.strip()
                if h_track_clean.lower() in TRACK_ALIASES:
                    h_track_clean = TRACK_ALIASES[h_track_clean.lower()]
                
                norm_h = normalize_string(h_track_clean)
                
                m = re.match(r'^(.+?)\s*\((.+?)\)$', h_track_clean)
                if m:
                    h_title, h_artist_hint = m.groups()
                    norm_h_title = normalize_string(h_title)
                    norm_h_artist_hint = normalize_string(h_artist_hint)
                    norm_h_artist_hint = re.sub(r'\s*(cover|live|version)\s*', '', norm_h_artist_hint)
                    
                    best_cand = None
                    best_ratio = 0.0
                    for cand in unique_pesni:
                        norm_c_title = normalize_string(cand['name'])
                        norm_c_artist = normalize_string(cand['artist'])
                        
                        title_ratio = difflib.SequenceMatcher(None, norm_h_title, norm_c_title).ratio()
                        if title_ratio >= 0.8:
                            artist_ratio = difflib.SequenceMatcher(None, norm_h_artist_hint, norm_c_artist).ratio()
                            if norm_h_artist_hint in norm_c_artist or norm_c_artist in norm_h_artist_hint or artist_ratio >= 0.7:
                                total_ratio = (title_ratio + max(artist_ratio, 0.7)) / 2
                                if total_ratio > best_ratio:
                                    best_ratio = total_ratio
                                    best_cand = cand
                    if best_cand and best_ratio >= 0.8:
                        return best_cand
                        
                best_cand = None
                best_ratio = 0.0
                for cand in unique_pesni:
                    norm_c_title = normalize_string(cand['name'])
                    ratio = difflib.SequenceMatcher(None, norm_h, norm_c_title).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_cand = cand
                        
                if best_cand and best_ratio >= 0.85:
                    return best_cand
                return None

            history_track_matches = {}
            for m_idx, top in enumerate(track_tops):
                for trk in top:
                    if trk and trk != "—" and trk not in history_track_matches:
                        history_track_matches[trk] = match_history_track(trk, valid_tracks)

            # Build history_tracks_map based on actual database matches!
            for m_idx, month_name in enumerate(months):
                top_tracks = track_tops[m_idx]
                for trk in top_tracks:
                    if trk and trk != "—":
                        matched = history_track_matches.get(trk)
                        if matched:
                            correct_artist = matched['artist']
                            correct_track_name = matched['name']
                            
                            # Clean and canonicalize artist
                            lower_art = correct_artist.lower()
                            if lower_art in ARTIST_ALIASES:
                                correct_artist = ARTIST_ALIASES[lower_art]
                                lower_art = correct_artist.lower()
                            
                            canonical_name = canonical_artists.get(lower_art, correct_artist)
                            
                            # Clean track name
                            clean_track = re.sub(r'\s+', ' ', correct_track_name).strip()
                            
                            if canonical_name not in history_tracks_map:
                                history_tracks_map[canonical_name] = {}
                            if month_name not in history_tracks_map[canonical_name]:
                                history_tracks_map[canonical_name][month_name] = []
                            if clean_track not in history_tracks_map[canonical_name][month_name]:
                                history_tracks_map[canonical_name][month_name].append(clean_track)

            for track in valid_tracks:
                track['avg_rank'] = 'N/A'
                track['history_ranks'] = []
                
            valid_track_appearances = {}
            for m_idx, top in enumerate(track_tops):
                for rank_idx, trk in enumerate(top):
                    if trk and trk != "—":
                        matched = history_track_matches.get(trk)
                        if matched:
                            t_id = matched['id']
                            if t_id not in valid_track_appearances:
                                valid_track_appearances[t_id] = []
                            valid_track_appearances[t_id].append((m_idx, rank_idx + 1))
                        
            for t_id, appearances in valid_track_appearances.items():
                t_obj = next((t for t in valid_tracks if t['id'] == t_id), None)
                if not t_obj:
                    continue
                m_debut = min(m for m, r in appearances)
                app_map = {m: r for m, r in appearances}
                
                # Calculate average rank ONLY for months where the track actually appeared in the top 50
                ranks = [r for m, r in appearances]
                avg_rank = sum(ranks) / len(ranks) if ranks else 0.0
                t_obj['avg_rank'] = round(avg_rank, 1)
                t_obj['history_ranks'] = ranks

            # Calculate tracks average rank monthly evolution for each artist
            for artist, art_data in artists_history_data.items():
                artist_lower = artist.lower()
                tracks_avg_history = []
                for m_idx in range(len(months)):
                    m_track_ranks = []
                    top_tracks = track_tops[m_idx]
                    for rank_idx, trk in enumerate(top_tracks):
                        if trk and trk != "—":
                            matched = history_track_matches.get(trk)
                            if matched and matched['artist'].lower() == artist_lower:
                                m_track_ranks.append(rank_idx + 1)
                    
                    if m_track_ranks:
                        avg_val = sum(m_track_ranks) / len(m_track_ranks)
                        tracks_avg_history.append({
                            "rank": round(avg_val, 1),
                            "penalty": False
                        })
                    else:
                        tracks_avg_history.append({
                            "rank": 51,
                            "penalty": True
                        })
                art_data["tracks_avg_history"] = tracks_avg_history

            # Calculate vibe dna monthly evolution
            bpm_history, energy_history, valence_history = [], [], []
            for m_idx in range(len(months)):
                m_bpms = []
                m_energies = []
                m_valences = []
                for trk in track_tops[m_idx]:
                    if trk and trk != "—":
                        matched = history_track_matches.get(trk)
                        if matched:
                            b_val = matched.get('bpm')
                            e_val = matched.get('energy')
                            v_val = matched.get('valence')
                            if b_val is not None and b_val != 'N/A':
                                try:
                                    m_bpms.append(float(b_val))
                                except (ValueError, TypeError):
                                    pass
                            if e_val is not None and e_val != 'N/A':
                                try:
                                    m_energies.append(float(e_val))
                                except (ValueError, TypeError):
                                    pass
                            if v_val is not None and v_val != 'N/A':
                                try:
                                    m_valences.append(float(v_val))
                                except (ValueError, TypeError):
                                    pass
                avg_b = sum(m_bpms) / len(m_bpms) if m_bpms else 120.0
                avg_e = sum(m_energies) / len(m_energies) if m_energies else 0.5
                avg_v = sum(m_valences) / len(m_valences) if m_valences else 0.5
                bpm_history.append(round(avg_b, 1))
                energy_history.append(round(avg_e, 3))
                valence_history.append(round(avg_v, 3))

        except Exception as e:
            print(f"[WARNING] Error reading '{history_path}': {e}")
            months = []
    else:
        print(f"[WARNING] History file '{history_path}' not found. Evolution metrics will be blank.")

    if not valid_tracks:
        return None

    # Calculate overall averages
    bpm_vals = [t['bpm'] for t in valid_tracks if t['bpm'] != 'N/A']
    avg_bpm = round(sum(bpm_vals) / len(bpm_vals)) if bpm_vals else 120
    
    energy_vals = [t['energy'] for t in valid_tracks if t['energy'] != 'N/A']
    avg_energy = sum(energy_vals) / len(energy_vals) if energy_vals else 0.6
    
    avg_dance = sum(t['danceability'] for t in valid_tracks) / len(valid_tracks)
    avg_valence = sum(t['valence'] for t in valid_tracks) / len(valid_tracks)
    
    vibe_counts = {}
    for t in valid_tracks:
        vibe_counts[t['vibe']] = vibe_counts.get(t['vibe'], 0) + 1
        
    dominant_vibe = max(vibe_counts, key=vibe_counts.get)
    vibe_translations = {
        'Party': '🔥 Взрывной Вечер / Танцевальный Драйв',
        'Energetic': '⚡ Заряжающий Рок / Мощная Энергия',
        'Chill': '🌌 Уютный Акустический Чилл',
        'Melancholic': '🎭 Глубокие Мысли / Меланхолия',
        'Happy': '☀️ Солнечное Настроение / Позитив',
        'Focus': '🚀 Интеллектуальный Фокус / Инструментал',
        'Balanced': '⚖️ Сбалансированный Вайб / Гармония'
    }
    dominant_vibe_ru = vibe_translations.get(dominant_vibe, "⚖️ Сбалансированный Вайб")

    # Extract top tracks with 3+ appearances in history
    top_tracks_history = []
    for t in valid_tracks:
        if t.get('history_ranks') and len(t['history_ranks']) >= 3:
            top_tracks_history.append({
                'id': t['id'],
                'name': t['name'],
                'artist': t['artist'],
                'album_art': t.get('album_art', 'N/A'),
                'avg_rank': t['avg_rank'],
                'appearances_count': len(t['history_ranks'])
            })
    
    # Calculate artist achievements
    achievements_data = {}
    achievements_detailed_data = {}
    total_months = len(months)
    for artist, art_data in artists_history_data.items():
        ach = calculate_artist_achievements(art_data["history"], total_months)
        if ach:
            achievements_data[artist] = ach
        ach_det = calculate_artist_achievements_detailed(artist, art_data["history"], total_months, months)
        if ach_det:
            achievements_detailed_data[artist] = ach_det

    # Calculate Music Impulse (rockets & falling stars)
    impulse_data = {"rockets": [], "stars": []}
    if total_months >= 2:
        m_curr = total_months - 1
        m_prev = total_months - 2
        
        artist_deltas = []
        for artist, art_data in artists_history_data.items():
            r_curr = 51
            if m_curr < len(art_data["history"]):
                entry = art_data["history"][m_curr]
                if entry.get("rank") is not None:
                    r_curr = entry["rank"]
            
            r_prev = 51
            if m_prev < len(art_data["history"]):
                entry = art_data["history"][m_prev]
                if entry.get("rank") is not None:
                    r_prev = entry["rank"]
            
            if r_curr == 51 and r_prev == 51:
                continue
                
            delta = r_prev - r_curr
            artist_deltas.append((artist, delta))
            
        rockets = sorted([item for item in artist_deltas if item[1] > 0], key=lambda x: -x[1])[:3]
        stars = sorted([item for item in artist_deltas if item[1] < 0], key=lambda x: x[1])[:3]
        
        rockets_list = []
        for r_art, d in rockets:
            lower_art = r_art.lower()
            canonical_name = canonical_artists.get(lower_art, r_art)
            rockets_list.append((canonical_name, d))
            
        stars_list = []
        for s_art, d in stars:
            lower_art = s_art.lower()
            canonical_name = canonical_artists.get(lower_art, s_art)
            stars_list.append((canonical_name, d))
            
        impulse_data = {
            "rockets": rockets_list,
            "stars": stars_list
        }

    # Calculate artist features for Head-to-Head Duel Mode
    artist_features = {}
    for artist_name in artists_history_data.keys():
        art_tracks = []
        for t in valid_tracks:
            t_art_lower = t['artist'].lower()
            a_art_lower = artist_name.lower()
            if a_art_lower == t_art_lower or a_art_lower in [part.strip().lower() for part in t['artist'].split(',')]:
                art_tracks.append(t)
        
        if not art_tracks:
            for t in valid_tracks:
                if artist_name.lower() in t['artist'].lower():
                    art_tracks.append(t)
                    
        if art_tracks:
            bpms = []
            energies = []
            valences = []
            for t in art_tracks:
                if t['bpm'] != 'N/A' and isinstance(t['bpm'], (int, float)) and t['bpm'] > 0:
                    bpms.append(t['bpm'])
                if t['energy'] != 'N/A' and isinstance(t['energy'], (int, float)):
                    energies.append(t['energy'] * 100.0)
                if t['valence'] != 'N/A' and isinstance(t['valence'], (int, float)):
                    valences.append(t['valence'] * 100.0)
            
            avg_bpm_val = sum(bpms) / len(bpms) if bpms else 120.0
            avg_energy_val = sum(energies) / len(energies) if energies else 50.0
            avg_valence_val = sum(valences) / len(valences) if valences else 50.0
            
            normalized_bpm = min(avg_bpm_val, 200) / 200 * 100
            
            artist_features[artist_name] = {
                "bpm": round(normalized_bpm, 1),
                "energy": round(avg_energy_val, 1),
                "valence": round(avg_valence_val, 1)
            }
        else:
            artist_features[artist_name] = {
                "bpm": 50.0,
                "energy": 50.0,
                "valence": 50.0
            }

    # Sort by appearances_count (descending), then by avg_rank (ascending)
    top_tracks_history.sort(key=lambda x: (-x['appearances_count'], x['avg_rank']))

    return {
        'valid_tracks': valid_tracks,
        'avg_bpm': avg_bpm,
        'avg_energy': avg_energy,
        'avg_dance': avg_dance,
        'avg_valence': avg_valence,
        'dominant_vibe': dominant_vibe_ru,
        'months': months,
        'artists_history_data': artists_history_data,
        'monthly_tops': monthly_tops,
        'top_tracks_history': top_tracks_history,
        'vibe_dna': {
            'bpm': bpm_history,
            'energy': energy_history,
            'valence': valence_history
        },
        'achievements': achievements_data,
        'achievements_detailed': achievements_detailed_data,
        'history_tracks_map': history_tracks_map,
        'music_impulse': impulse_data,
        'artist_features': artist_features
    }

def parse_weekly_top(filepath):
    """
    Parses weekly_top.csv file into structured format:
    {"week_name": {"artists": [...], "tracks": [...]}}
    """
    if not os.path.exists(filepath):
        return {}
        
    content = ""
    # Try UTF-8 first, fallback to CP1251
    for encoding in ['utf-8', 'cp1251']:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
            
    if not content:
        return {}
        
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if len(lines) < 2:
        return {}
        
    # Read headers (Row 0)
    reader = csv.reader([lines[0]], delimiter=';')
    headers = next(reader)
    
    # Read data rows (Rows 1 to 5, which correspond to top 5)
    data_rows = []
    for line in lines[1:6]:
        # Only process if not completely empty semicolons like line 7
        if line.replace(';', '').strip() == '':
            break
        rdr = csv.reader([line], delimiter=';')
        data_rows.append(next(rdr))
        
    weekly_data = {}
    
    num_cols = len(headers)
    for col_idx in range(0, num_cols, 2):
        if col_idx >= len(headers):
            break
            
        week_name = headers[col_idx].strip()
        if not week_name:
            # If the header cell is empty, check if we can skip it
            continue
            
        artists = []
        tracks = []
        
        for r_idx in range(len(data_rows)):
            row = data_rows[r_idx]
            
            # Fetch artist (even column)
            artist_val = ""
            if col_idx < len(row):
                artist_val = row[col_idx].strip()
                
            # Fetch track (odd column, immediately to the right)
            track_val = ""
            if (col_idx + 1) < len(row):
                track_val = row[col_idx + 1].strip()
                
            # If both are empty, don't add
            if artist_val or track_val:
                artists.append(artist_val if artist_val else "—")
                tracks.append(track_val if track_val else "—")
                
        if artists or tracks:
            weekly_data[week_name] = {
                "artists": artists,
                "tracks": tracks
            }
            
    return weekly_data
