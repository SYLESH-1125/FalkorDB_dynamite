import re
import sys

text = sys.stdin.read()
text = re.sub(
    r"^Co-authored-by:\s*Cursor\s*<cursoragent@cursor\.com>\s*\n?",
    "",
    text,
    flags=re.IGNORECASE | re.MULTILINE,
)
sys.stdout.write(text.rstrip() + "\n")
