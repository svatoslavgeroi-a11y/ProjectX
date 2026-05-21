with open("data_processor.py", "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 369):
        if "return" in line and line_num > 600:
            print(f"Line {line_num}: {line.strip()[:100]}")
