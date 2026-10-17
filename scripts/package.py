#!/usr/bin/env python3
"""Package the repository into frozen-catch.zip at the repository root."""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "frozen-catch.zip")
INCLUDE = [
    "index.html",
    "README.md",
    "LICENSE",
    "package.json",
    ".gitignore",
    ".github/workflows/pages.yml",
    "docs/design-notes.md",
    "levels/levels.json",
    "scripts/generate-levels.mjs",
    "scripts/package.py",
    "src/main.js",
    "src/levels-data.js",
    "src/logic/board.js",
    "src/logic/game.js",
    "src/logic/solver.js",
    "src/logic/generator.js",
    "src/render/renderer.js",
    "src/render/audio.js",
    "src/ui/shop.js",
    "src/ui/storage.js",
    "src/ui/styles.css",
    "tests/board.test.js",
    "tests/game.test.js",
    "tests/generator.test.js",
    "tests/levels.test.js",
    "tests/solver.test.js",
    "tests/storage.test.js",
]

if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as bundle:
    for relative in INCLUDE:
        path = os.path.join(ROOT, relative)
        if not os.path.isfile(path):
            raise SystemExit("Missing required file: " + relative)
        bundle.write(path, relative)

print(f"Wrote {OUTPUT} with {len(INCLUDE)} files, {os.path.getsize(OUTPUT)} bytes.")
