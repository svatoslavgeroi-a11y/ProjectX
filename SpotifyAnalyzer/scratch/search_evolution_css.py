with open("templates/dashboard.html", "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if "evolution-main-layout" in line or "charts-column" in line or "chart-box" in line:
            if line_num < 2700:
                print(f"Line {line_num}: {line.strip()[:100]}")
