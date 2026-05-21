import csv
import sys
sys.stdout.reconfigure(encoding='utf-8')

r = list(csv.reader(open('weekly_top1.csv', encoding='cp1251'), delimiter=';'))
for i in range(6, min(len(r), 45)):
    row = r[i]
    col0 = row[0].strip() if len(row) > 0 else ''
    col2 = row[2].strip() if len(row) > 2 else ''
    if col0 or col2:
        print(f"Row {i+1}: Col 0: '{col0}' | Col 2: '{col2}'")
