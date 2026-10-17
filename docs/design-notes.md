# Frozen Catch design notes

## Core loop

Each board is a wall of ice. Coloured fish are frozen in the wall and their
arrangement forms the hidden picture. Penguin squads wait below the board.

1. Tap a squad to send it to an open slot on the ice shelf.
2. A squad sends penguins after reachable fish of its own colour.
3. A fish is reachable when it touches open water connected to the bottom
   edge. Collecting a fish turns its cell into open water and can expose
   fish that were buried deeper in the ice.
4. When a squad has carried its quota, it waddles away and frees its slot.
5. Clear every fish to melt the ice and reveal the picture.

## Rules

- A level is lost when every slot is full and no active squad can reach a
  fish, or when no squads remain and the remaining fish cannot be reached.
- Mystery fish (`?`) reveal their colour when a penguin reaches them. If the
  colour matches the squad, the fish is carried home; otherwise the penguin
  returns empty-flippered.
- Locked fish cannot be targeted while another fish sits directly above them.
- From level 18, wider boards have two igloos. Penguins always use the nearer
  igloo for their journey.

## Boosters

- Extra Slot expands the ice shelf from five to seven slots.
- Shuffle Squads reorders the waiting squads.
- Undo Last Tap restores the state before the most recent squad placement.

Any booster use caps a win at two stars; restarting a level caps it at one
star. A clean win earns three stars.

## Solvability

`src/logic/solver.js` searches the real game-state space with depth-first
search and memoization. It is used to:

- verify all 60 story levels;
- reject unsolvable procedural boards in Endless Expedition;
- estimate difficulty from solver nodes and average branching factor.

## Art and audio

All fish, penguins, igloos, ice, splash, sparkle and UI art are original
canvas vector drawings created in code. All sound effects are synthesized at
runtime with the Web Audio API. No external assets, fonts, audio files,
network calls, advertisements, or real-money purchases are used.
