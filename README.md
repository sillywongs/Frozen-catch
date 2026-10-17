# Frozen Catch

A cozy, touch-first penguin puzzle game for mobile and desktop browsers. Send
coloured penguin squads into an ice wall, free every frozen fish, and reveal
the picture hidden in the ice.

![Frozen Catch screenshot](docs/screenshot-placeholder.png)

## How to play

- Tap a coloured squad below the board to send it to an open slot.
- Penguins collect reachable fish matching their squad colour.
- A fish is reachable when it touches open water connected to the bottom edge.
- Clear all fish to win; the ice melts away and reveals the picture.
- Avoid filling every slot with squads that cannot reach anything.
- Win without boosters for 3 stars, with boosters for 2 stars, or after a
  restart for 1 star.
- Earn coins from wins and spend them in the shop on Extra Slot, Shuffle
  Squads, and Undo Last Tap.
- Story mode has 60 verified levels. Endless Expedition generates additional
  solvable boards.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser. Do not open `index.html`
directly from the filesystem; ES modules require an HTTP server.

## Run tests

```bash
npm test
```

The tests use Node's built-in test runner and have zero dependencies.

## Publish to GitHub Pages

1. Create a new public GitHub repository.
2. Choose **uploading an existing file** on the repository page.
3. Unzip `frozen-catch.zip`.
4. Upload every file and folder from inside the zip directly into the
   repository root. Do not upload an extra parent folder.
5. If your file picker hides hidden folders, enable **Show hidden files** and
   upload `.github` as well; alternatively upload the files inside
   `.github/workflows` separately.
6. Commit the upload.
7. Open **Settings -> Pages**.
8. Under **Build and deployment**, set Source to **GitHub Actions**.
9. Wait for the workflow to run. Your game will be available at
   `https://<your-username>.github.io/<your-repository-name>/`.

The included workflow runs `npm test` before deploying the repository to
GitHub Pages.

## Add a level

Add an object to the `levels` array in `levels/levels.json`, then mirror it in
`src/levels-data.js` (or run `node scripts/generate-levels.mjs` to rebuild the
shipped layouts).

```json
{
  "id": 61,
  "name": "New Picture",
  "rows": 7,
  "cols": 7,
  "igloos": [{ "r": 6, "c": 3 }],
  "slots": 5,
  "squads": [{ "color": 0, "quota": 2 }],
  "grid": [
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, { "c": 0 }, null, null, null]
  ]
}
```

Cell schema:

- `null`: open water.
- `{ "c": 0 }`: a fish of colour 0.
- `{ "c": 0, "m": true }`: a mystery fish; its colour is hidden until reached.
- `{ "c": 0, "l": true }`: a locked fish; it cannot be targeted while another
  fish is directly above it.

The eight colours are Coral, Teal, Sun, Violet, Mint, Rose, Sky, and Amber.
Every level must have exactly one fish for each unit of squad quota and must
be solvable within its slot limit.

## Credits

All game art, animation, level layouts, text, and audio are original work
created for Frozen Catch. Sound is generated with the Web Audio API; no audio
files, external CDNs, advertisements, network calls, or real-money purchases
are used. Released under the MIT License.
