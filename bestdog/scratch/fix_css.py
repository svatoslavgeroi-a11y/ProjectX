import os

def fix_css():
    path = r'c:\Users\svato\bestdog\style.css'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(path, 'r', encoding='latin-1') as f:
            content = f.read()

    # Fix 1: Isolate Game Styles
    content = content.replace(
        '.game-img-wrapper, .game-modal img {\n    max-height: 180px !important;',
        '/* Изоляция стилей игры */\n.game-modal .game-img-wrapper img, .game-modal #game-main-img {\n    max-height: 180px !important;'
    )

    # Fix 2: Restore Gallery Images
    target2 = """/* Возвращаем сочные фотки в галерею */
.dog-card img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    aspect-ratio: 1 / 1 !important; /* Квадратные карточки */
    max-height: none !important; /* Сбрасываем ограничение от игры */
}"""
    
    # Since the existing block might be slightly different, let's use a regex or a more flexible search
    import re
    
    # Search for the .dog-card img block
    pattern_img = r'\.dog-card img \{[^}]+\}'
    replacement_img = """/* Возвращаем сочные фотки в галерею */
.dog-card img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    aspect-ratio: 1 / 1 !important; /* Квадратные карточки */
    max-height: none !important; /* Сбрасываем ограничение от игры */
}"""
    
    # We only want to replace the one at the end if there are multiple, or all if they are leaks.
    # The user mentioned it's a leak from the game.
    
    # Replacement 3: .dog-card stability
    pattern_card = r'\.dog-card \{[^{}]*position: relative !important;[^{}]*overflow: hidden !important;[^{}]*\}'
    replacement_card = """.dog-card {
    position: relative !important;
    overflow: hidden !important;
    transform: translateZ(0); /* Оптимизация без ущерба позиционированию */
}"""

    # Replacement 4: .new-badge
    pattern_badge = r'\.new-badge \{[^{}]*position: absolute !important;[^{}]*top: 10px !important;[^{}]*left: 10px !important;[^{}]*z-index: 10 !important;[^{}]*background: rgba\(255, 215, 0, 0\.85\) !important;[^{}]*color: #222 !important;[^{}]*padding: 6px 10px !important;[^{}]*border-radius: 8px !important;[^{}]*font-size: 0\.75rem !important;[^{}]*font-weight: bold !important;[^{}]*\}'
    replacement_badge = """.new-badge {
    position: absolute !important;
    top: 10px !important;
    left: 10px !important;
    z-index: 10 !important;
    background: rgba(255, 215, 0, 0.85) !important; /* Сочный золотой фон */
    color: #222 !important;
    padding: 4px 8px !important;
    border-radius: 8px !important;
    font-size: 0.8rem !important;
    font-weight: bold !important;
    backdrop-filter: blur(4px) !important; /* Эффект стекла */
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    pointer-events: none !important;
}"""

    # Let's do exact replacements instead of regex if possible to avoid destroying the file
    # I'll use the strings I saw in Select-String
    
    content = content.replace(
        '.dog-card img {\n    width: 100% !important;\n    height: 100% !important;\n    object-fit: cover !important;\n    aspect-ratio: 1 / 1 !important;\n    max-height: none !important;\n}',
        replacement_img
    )
    
    content = content.replace(
        '.dog-card {\n    position: relative !important;\n    overflow: hidden !important;\n}',
        replacement_card
    )
    
    # For the badge, I'll use a more targeted replacement
    content = content.replace(
        '.new-badge {\n    position: absolute !important;\n    top: 10px !important;\n    left: 10px !important;\n    z-index: 10 !important;\n    background: rgba(255, 215, 0, 0.85) !important;\n    color: #222 !important;\n    padding: 6px 10px !important;\n    border-radius: 8px !important;\n    font-size: 0.75rem !important;\n    font-weight: bold !important;\n}',
        replacement_badge
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")

if __name__ == "__main__":
    fix_css()
