from pathlib import Path

path = Path('js/main.js')
text = path.read_text(encoding='utf-8')
text = text.replace("] .join('\\\\n')".replace('] ', ']'), "].join('\\n')")
path.write_text(text, encoding='utf-8')
