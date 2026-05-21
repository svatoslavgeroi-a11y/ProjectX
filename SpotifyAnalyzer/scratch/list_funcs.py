with open("data_processor.py", "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        if "def " in line:
            print(f"Line {line_num}: {line.strip()}")
