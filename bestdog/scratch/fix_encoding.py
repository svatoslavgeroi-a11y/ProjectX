import os

def fix_mojibake(text):
    try:
        # Try to fix UTF-8 that was read as CP1251 and then saved back as UTF-8
        # This is a common pattern for the garbage seen
        return text.encode('cp1251').decode('utf-8')
    except:
        return text

file_path = r'c:\Users\svato\bestdog\style.css'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '/*' in line or '//' in line:
        # Only try to fix lines with comments to avoid breaking actual CSS logic
        # though CSS logic usually doesn't have non-ascii chars unless it's content: ""
        fixed_line = fix_mojibake(line)
        new_lines.append(fixed_line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Encoding fix attempt completed.")
