with open("templates/dashboard.html", "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if "select" in line.lower() or "id=\"artist" in line.lower():
            print(f"Line {line_num}: {line.strip()[:100]}")
