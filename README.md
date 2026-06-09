# PolyMatch — A Responsive, Animated Match‑3 Engine

[https://ifnowcode.github.io/polymatch/](https://ifnowcode.github.io/polymatch/)

PolyMatch is a fully‑animated, canvas‑based **match‑3 puzzle engine** built for the modern web.
It features smooth falling animations, cascading matches, emoji‑powered scoring, multiple match modes, and a responsive layout that adapts to desktop and mobile automatically.

PolyMatch is designed to be:

  * **Deterministic**

  * **Modular**

  * **Extensible**

  * **Responsive**

---

## ✨ Features

  * **Cascading Match Engine**
  Matches trigger gravity, which may trigger more matches, which may trigger more scoring.

  * **Emoji Power‑Ups** (Future enhancement)
  Special emojis award bonus points and are tracked in the stats panel.

  * **Smooth Falling Animation**
  Pieces fall with time‑based animation, not frame‑based jumps.

  * **Responsive Canvas**
  The board stays perfectly square and scales to any device.

  * **Desktop + Mobile Layouts**
  Scoreboard on the left (desktop), below the board (mobile).

  * **Real‑Time Stats Dashboard**
  Tracks:

    * Score

    * Run lengths
    
        * Color and shape matches
        
        * Shape matches
        
        * Cascade matches

    * Emoji hits

    * Player‑initiated vs cascade‑initiated matches

    * Total removed pieces

---

## 🎮 Gameplay Overview

PolyMatch is an 8×8 grid of polygons.
Each polygon has:

  * a **color**

  * a **shape**

  * an optional **emoji**

Player swaps adjacent pieces to create matches of 3 or more.
Depending on the mode, matches may be based on:

  * shape only

  * color only

  * color AND shape

  * color OR shape

  * strict super‑match rules

Matches trigger:

  1. **Vaporize animation**

  2. **Removal**

  3. **Gravity**

  4. **Cascading matches**

  5. **Scoring**

  6. **Stats updates**

---

## 🧠 Architecture

### Core Systems

  * **Grid System** — 2D array of polygon objects

  * **Match System** — Mode‑specific match detection

  * **Removal System** — Structured match consumption

  * **Gravity System** — Rebuilds the grid and spawns new pieces

  * **Animation System** — Falling + vaporize effects

  * **Stats System** — Tracks all scoring and match metadata

  * **Responsive Layout System** — Keeps the board square and mobile‑friendly

Each subsystem is isolated and deterministic, making PolyMatch easy to extend.

---

## 📐 Responsive Layout

PolyMatch uses a **CSS‑driven responsive layout**:

* Desktop:

Code
```
[ Scoreboard ] [ Board ]
```

Mobile (portrait or narrow aspect):

* Code
```
[ Board ]
[ Scoreboard ]
```

This is achieved using:

  * `flex-direction` switching

  * `aspect-ratio: 1/1` for the board

  * A stable CSS width for the canvas wrapper

  * A JS `resizeGame()` that updates internal resolution without feedback loops

---

## 🏆 Scoring System

PolyMatch uses a flexible scoring engine:

  * **Run length scoring**

  * **Emoji bonus scoring**

  * **Player vs cascade attribution**

  * **Run‑length statistics**

  * **Emoji hit statistics**

  * **Total removed pieces**

Scoring logic is mode‑specific and easy to extend.

---

## 📊 Stats Dashboard

The stats panel displays:

Score

  * Total removed

  * Run lengths + match counts

  * Emoji hits

  * Player‑initiated runs

  * Cascade‑initiated runs

It updates every frame via `renderStats()`.

---

## 🛠 Development Notes

  * The engine is fully deterministic.

  * All animations are time‑based (`dt`), not frame‑based.

  * The grid is rebuilt on every gravity pass.

  * Falling pieces are tracked separately from the static grid.

  * The canvas is redrawn every frame.

  * The responsive layout is CSS‑driven; JS only updates internal resolution.

---

## 🚀 Roadmap

  * Special power‑ups

  * Combo multipliers

  * Timed modes

  * Level progression

  * Sound effects

  * Touch gestures

  * Theme packs