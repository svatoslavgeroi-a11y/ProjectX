import csv
import sys
sys.stdout.reconfigure(encoding='utf-8')
r = list(csv.reader(open('weekly_top.csv', encoding='cp1251'), delimiter=';'))
for i in range(1, len(r)):
    row = r[i]
    # Check if there are any populated cells in columns 0, 2, 4 beyond row 5
    vals = []
    for col in range(len(row)):
        val = row[col].strip()
        if val:
            vals.append((col, val))
    if vals:
        print(f"Row {i}: {vals[:6]}")
