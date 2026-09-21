#!/usr/bin/env python3
"""Read-only comparison of a library source tree and a vendored consumer."""
import argparse
from pathlib import Path
import hashlib

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--consumer', required=True, type=Path)
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
consumer = args.consumer.resolve()
ignored = {'node_modules', 'dist', 'styled-system', '.git', '__pycache__', '.DS_Store'}
def inventory(root):
    if not (root / 'package.json').is_file():
        raise SystemExit(f'Not a UI package directory: {root}')
    return {str(f.relative_to(root)): hashlib.sha256(f.read_bytes()).hexdigest()
            for f in root.rglob('*') if f.is_file()
            and not any(part in ignored or part.startswith('.env') for part in f.relative_to(root).parts)}
a, b = inventory(source), inventory(consumer)
differences = []
for name in sorted(a.keys() | b.keys()):
    if name not in a: differences.append(f'EXTRA in consumer: {name}')
    elif name not in b: differences.append(f'MISSING in consumer: {name}')
    elif a[name] != b[name]: differences.append(f'CHANGED: {name}')
print('\n'.join(differences) if differences else f'MATCH: {len(a)} source/config/example/test/document files')
raise SystemExit(bool(differences))
