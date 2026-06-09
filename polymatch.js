let falling = []; // active falling animations

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const modeSel = document.getElementById("modeSel");
const block = document.getElementById("block");

const COLS = 8;
const ROWS = 8;
let TILE_SIZE = canvas.width / COLS;

const tracedebug = false;
const tracerun = false;

const COLORS = ["#ff4b5c","#ffb400","#4cd137","#00a8ff","#9b59b6"];
const SHAPES = ["circle","square","diamond","triangle"];
const EMOJIS = ["❤️", "🖤", "🐞", "✨", "💥", "🕸️", "🔥", "⭐", "⚡", "🌸"];

let stats = {
  score: 0,
  runs: {},
  cascade: {},
  matches: {},
  super: {},
  emojis: {},
  playerRuns: 0,
  cascadeRuns: 0,
  removed: 0,
};

let isCascade = false;
let selected = null;
let busy = false;

function randomPolygon() {
  let emoji = "";
  if (Math.floor(Math.random()*100) > 87) {
    emoji = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
  }
  return {
    color: COLORS[Math.floor(Math.random()*COLORS.length)],
    shape: SHAPES[Math.floor(Math.random()*SHAPES.length)],
    emoji: emoji,
  };
}

function createGrid() {
  grid = [];
  for (let r=0;r<ROWS;r++) {
    let row = [];
    for (let c=0;c<COLS;c++) {
      row.push(randomPolygon());
    }
    grid.push(row);
  }
  // Ensure no initial matches
  removeAllMatches(true);
}

// Draw emoji centered on the polygon
function drawEmoji(emoji, x, y) {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  
  //ctx.globalAlpha = 0.8;

  ctx.font = `${TILE_SIZE * 0.5}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy);
  
  //ctx.globalAlpha = 1.0;
}

function drawPolygon(polygon, x, y) {
  const cx = x + TILE_SIZE/2;
  const cy = y + TILE_SIZE/2;
  const s = TILE_SIZE*0.35;

  ctx.fillStyle = polygon.color;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  if (polygon.shape === "circle") {
    ctx.beginPath();
    ctx.arc(cx, cy, s, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    drawEmoji(polygon.emoji, cx - (TILE_SIZE/2), cy - (TILE_SIZE/2));
  } else if (polygon.shape === "square") {
    ctx.beginPath();
    ctx.rect(cx - s, cy - s, s*2, s*2);
    ctx.fill();
    ctx.stroke();
    drawEmoji(polygon.emoji, cx - (TILE_SIZE/2), cy - (TILE_SIZE/2));
  } else if (polygon.shape === "diamond") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - (TILE_SIZE/2.5));
    ctx.lineTo(cx + (TILE_SIZE/2.5), cy);
    ctx.lineTo(cx, cy + (TILE_SIZE/2.5));
    ctx.lineTo(cx - (TILE_SIZE/2.5), cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawEmoji(polygon.emoji, cx - (TILE_SIZE/2), cy - (TILE_SIZE/2));
  } else if (polygon.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);        // top
    ctx.lineTo(cx + s, cy + s);    // bottom right
    ctx.lineTo(cx - s, cy + s);    // bottom left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawEmoji(polygon.emoji, cx - (TILE_SIZE/2), cy - (TILE_SIZE/2.5));
  }
}

function drawGrid() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw static pieces
  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      const x = c*TILE_SIZE;
      const y = r*TILE_SIZE;
      ctx.fillStyle = "#333";
      ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
      ctx.strokeStyle = "#000";
      ctx.strokeRect(x,y,TILE_SIZE,TILE_SIZE);

      const polygon = grid[r][c];
      if (polygon) drawPolygon(polygon, x, y);
    }
  }

  // Draw falling pieces
  for (let f of falling) {
    const x = f.c * TILE_SIZE;
    drawPolygon(f.piece, x, f.y);
  }

  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.strokeRect(
      selected.c*TILE_SIZE+ctx.lineWidth,
      selected.r*TILE_SIZE+ctx.lineWidth,
      TILE_SIZE-ctx.lineWidth*2,
      TILE_SIZE-ctx.lineWidth*2
    );
  }
}

function getMatches() {
  switch (modeSel.value) {
    case "0": return getMatches_00();
    case "1": return getMatches_01();
    case "2": return getMatches_02();
    case "3": return getMatches_03();
  }
}

function removeAllMatches(initialFill = false) {
  if (tracedebug) console.log("removeAllMatches switchboard entry");
  switch (modeSel.value) {
    case "0":
      let result = removeAllMatches_00(initialFill);
      if (tracedebug) console.log("removeAllMatches switchboard exit");
      return result;
    case "1": return removeAllMatches_01(initialFill);
    case "2": return removeAllMatches_02(initialFill);
    case "3": return removeAllMatches_03(initialFill);
  }
}

function getMatches_00() {
  let matches = [];

  // Horizontal
  for (let r=0;r<ROWS;r++) {
    let runStart = 0;
    for (let c=1;c<=COLS;c++) {
      let same = false;
      if (c < COLS && grid[r][c] && grid[r][c-1] &&
          //grid[r][c].color === grid[r][c-1].color &&
          grid[r][c].shape === grid[r][c-1].shape) {
        same = true;
      }
      if (!same) {
        let runLen = c - runStart;
        if (runLen >= 3) {
          for (let k=runStart;k<c;k++) {
            matches.push({r, c:k});
          }
        }
        runStart = c;
      }
    }
  }

  // Vertical
  for (let c=0;c<COLS;c++) {
    let runStart = 0;
    for (let r=1;r<=ROWS;r++) {
      let same = false;
      if (r < ROWS && grid[r][c] && grid[r-1][c] &&
          //grid[r][c].color === grid[r-1][c].color &&
          grid[r][c].shape === grid[r-1][c].shape) {
        same = true;
      }
      if (!same) {
        let runLen = r - runStart;
        if (runLen >= 3) {
          for (let k=runStart;k<r;k++) {
            matches.push({r:k, c});
          }
        }
        runStart = r;
      }
    }
  }

  // Deduplicate
  const key = p => p.r + "," + p.c;
  const map = {};
  matches.forEach(m => map[key(m)] = m);
  return Object.values(map);
}

function getMatches_02() {
  let matches = [];

  function pushMatch(cells) {
    if (cells.length < 3) return;

    const first = grid[cells[0].r][cells[0].c];

    // Check if all share color
    const sameColor = cells.every(p => grid[p.r][p.c].color === first.color);

    // Check if all share shape
    const sameShape = cells.every(p => grid[p.r][p.c].shape === first.shape);

    matches.push({
      cells,
      color: first.color,
      shape: first.shape,
      isSuper: sameColor && sameShape   // SUPER MATCH
    });
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = [ {r, c:0} ];
    for (let c = 1; c <= COLS; c++) {
      const prev = grid[r][c-1];
      const curr = c < COLS ? grid[r][c] : null;

      const sameColor = curr && prev && curr.color === prev.color;
      const sameShape = curr && prev && curr.shape === prev.shape;

      if (sameColor || sameShape) {
        run.push({r, c});
      } else {
        pushMatch(run);
        run = curr ? [{r, c}] : [];
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let run = [ {r:0, c} ];
    for (let r = 1; r <= ROWS; r++) {
      const prev = grid[r-1][c];
      const curr = r < ROWS ? grid[r][c] : null;

      const sameColor = curr && prev && curr.color === prev.color;
      const sameShape = curr && prev && curr.shape === prev.shape;

      if (sameColor || sameShape) {
        run.push({r, c});
      } else {
        pushMatch(run);
        run = curr ? [{r, c}] : [];
      }
    }
  }

  return matches;
}

function getMatches_01() {
  let matches = [];

  function pushMatch(cells) {
    if (cells.length < 3) return;

    const first = grid[cells[0].r][cells[0].c];

    // Strict match: must match BOTH color and shape
    const strict = cells.every(p => {
      const g = grid[p.r][p.c];
      return g.color === first.color && g.shape === first.shape;
    });

    if (strict) {
      matches.push({
        cells,
        color: first.color,
        shape: first.shape,
        isSuper: true   // all strict matches are super matches
      });
    }
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = [{ r, c: 0 }];
    for (let c = 1; c <= COLS; c++) {
      const prev = grid[r][c - 1];
      const curr = c < COLS ? grid[r][c] : null;

      const sameColor = curr && prev && curr.color === prev.color;
      const sameShape = curr && prev && curr.shape === prev.shape;

      if (sameColor && sameShape) {
        run.push({ r, c });
      } else {
        pushMatch(run);
        run = curr ? [{ r, c }] : [];
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let run = [{ r: 0, c }];
    for (let r = 1; r <= ROWS; r++) {
      const prev = grid[r - 1][c];
      const curr = r < ROWS ? grid[r][c] : null;

      const sameColor = curr && prev && curr.color === prev.color;
      const sameShape = curr && prev && curr.shape === prev.shape;

      if (sameColor && sameShape) {
        run.push({ r, c });
      } else {
        pushMatch(run);
        run = curr ? [{ r, c }] : [];
      }
    }
  }

  return matches;
}

function getMatches_03() {
  let matches = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = [{ r, c: 0 }];
    for (let c = 1; c <= COLS; c++) {
      const prev = grid[r][c - 1];
      const curr = c < COLS ? grid[r][c] : null;

      const same =
        curr &&
        prev &&
        curr.shape === prev.shape; // shape-only mode

      if (same) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) {
          matches.push({
            cells: [...run],
            isSuper: false
          });
        }
        run = curr ? [{ r, c }] : [];
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    let run = [{ r: 0, c }];
    for (let r = 1; r <= ROWS; r++) {
      const prev = grid[r - 1][c];
      const curr = r < ROWS ? grid[r][c] : null;

      const same =
        curr &&
        prev &&
        curr.shape === prev.shape;

      if (same) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) {
          matches.push({
            cells: [...run],
            isSuper: false
          });
        }
        run = curr ? [{ r, c }] : [];
      }
    }
  }

  return matches;
}


function waitForFalling() {
  return new Promise(resolve => {
    function check() {
      if (falling.every(f => f.y >= f.endY)) resolve();
      else requestAnimationFrame(check);
    }
    check();
  });
}

function scoreRun(len) {
  if (len === 3) return 10;
  if (len === 4) return 40;
  if (len === 5) return 100;
  if (len === 6) return 250;
  if (len === 7) return 500;
  if (len === 8) return 1000;
  return 0;
}

function runIsAllSameColor(m) {
  if (tracerun) console.log("RUN SCORE check:", m);
  if (!m.cells || m.cells.length === 0) return false;

  const first = grid[m.cells[0].r][m.cells[0].c];
  if (!first) return false;

  return m.cells.every(cell => {
    const poly = grid[cell.r][cell.c];
    return poly && poly.color === first.color;
  });
}

function runIsAllSameShape(m) {
  if (!m.cells || m.cells.length === 0) return false;

  const first = grid[m.cells[0].r][m.cells[0].c];
  if (!first) return false;

  return m.cells.every(cell => {
    const poly = grid[cell.r][cell.c];
    return poly && poly.shape === first.shape;
  });
}

function runIsStrictMatch(m) {
  if (!m.cells || m.cells.length === 0) return false;

  const first = grid[m.cells[0].r][m.cells[0].c];
  if (!first) return false;

  return m.cells.every(cell => {
    const poly = grid[cell.r][cell.c];
    return poly &&
           poly.color === first.color &&
           poly.shape === first.shape;
  });
}

function scoreEmoji(emoji) {
  if (!emoji) return 0;
  return 50; // flat bonus per emoji
}

async function removeAllPieces() {
  // Build a list of every cell on the board
  busy = true;
  let toRemove = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      toRemove.push({ r, c });
    }
  }

  // Play your existing vaporize animation
  await AnimationSystem.play("vaporize", toRemove, { duration: 300 });

  // Remove everything
  for (let { r, c } of toRemove) {
    grid[r][c] = null;
  }

  // Use your existing falling system
  applyGravityWithAnimation();
  await waitForFalling();

  removeAllMatches();

  busy = false;
}

async function removeAllMatches_00(initialFill = false) {
  busy = true;
  let totalRemoved = 0;
  if (tracedebug) console.log("removeAllMatches enter", initialFill);

  while (true) {
    const matches = getMatches_00();
    if (matches.length === 0) break;

    // Collect cells to remove
    let toRemove = [];

    for (let m of matches) {
      // m is a single cell {r, c} in this version
      toRemove.push({ r: m.r, c: m.c });
    }

    // 🔥 PLAY ANIMATION BEFORE REMOVAL (only during gameplay)
    if (!initialFill && toRemove.length > 0) {
      await AnimationSystem.play("vaporize", toRemove, { duration: 300 });
    }

    // Remove polygons
    for (let { r, c } of toRemove) {
      grid[r][c] = null;
    }

    totalRemoved += toRemove.length;

    applyGravityWithAnimation();
    await waitForFalling();
  }

  if (!initialFill && totalRemoved > 0) {
    stats.score += totalRemoved * 1; // or 10 if you prefer
    scoreEl.textContent = stats.score;
  }

  if (tracedebug) console.log("removeAllMatches exit", initialFill);
  busy = false;
}

async function removeAllMatches_02(initialFill = false) {
  busy = true;
  let totalRemoved = 0;

  while (true) {
    const matches = getMatches_02();
    if (matches.length === 0) break;

    let toRemove = {};

    for (let m of matches) {
      if (m.isSuper) {
        // SUPER MATCH: remove ALL polygons of same color+shape
        if (tracerun) console.log("Super match!");
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const polygon = grid[r][c];
            if (polygon &&
                polygon.color === m.color &&
                polygon.shape === m.shape) {
              toRemove[r + "," + c] = {r, c};
            }
          }
        }
      } else {
        // Normal match
        for (let cell of m.cells) {
          toRemove[cell.r + "," + cell.c] = cell;
        }
      }
    }

    // Remove all marked polygons
    const removedCount = Object.keys(toRemove).length;
    totalRemoved += removedCount;

    if (!initialFill) {
      const cells = Object.values(toRemove);
      // 🔥 PLAY ANIMATION BEFORE REMOVAL
      await AnimationSystem.play("vaporize", cells, { duration: 300 });
    }

    for (let key in toRemove) {
      const {r, c} = toRemove[key];
      grid[r][c] = null;
    }

    applyGravityWithAnimation();
    await waitForFalling();

  }

  if (!initialFill && totalRemoved > 0) {
    stats.score += totalRemoved * 10;
    scoreEl.textContent = stats.score;
  }

  busy = false;
}

async function removeAllMatches_01(initialFill = false) {
  busy = true;
  let totalRemoved = 0;

  while (true) {
    const matches = getMatches_01();
    if (matches.length === 0) break;

    let toRemove = {};

    for (let m of matches) {
      // Remove ALL polygons of same color+shape
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const polygon = grid[r][c];
          if (polygon &&
              polygon.color === m.color &&
              polygon.shape === m.shape) {
            toRemove[r + "," + c] = { r, c };
          }
        }
      }
    }

    const cells = Object.values(toRemove);

    if (!initialFill && cells.length > 0) {
      await AnimationSystem.play("vaporize", cells, { duration: 300 });
    }

    for (let { r, c } of cells) {
      grid[r][c] = null;
    }

    totalRemoved += cells.length;

    applyGravityWithAnimation();
    await waitForFalling();

  }

  if (!initialFill && totalRemoved > 0) {
    stats.score += totalRemoved * 10;
    scoreEl.textContent = stats.score;
  }

  busy = false;
}

async function removeAllMatches_03(initialFill = false) {
  busy = true;
  let totalRemoved = 0;

  while (true) {
    const matches = getMatches_03();
    if (matches.length === 0) break;
    
    // Dedup cells
    let toRemoveMap = {};

    for (let m of matches) {
      // scoring -------------------
      const len = m.cells.length;
      if (!initialFill) stats.removed += len;

      // Track run length stats
      if (!initialFill)  {
        if (!stats.runs[len]) stats.runs[len] = 0;
        stats.runs[len]++;
        // Add score for this run
        if (tracerun) console.log("Cascade", isCascade);
        if (runIsAllSameColor(m) && !isCascade) {
          stats.score += scoreRun(len) * 10;
          if (tracerun) console.log("SCORE: BONUS! Player run all same color!", len, scoreRun(len) * 10)
          if (!stats.super[len]) stats.super[len] = 0;
          stats.super[len]++;
          if (tracedebug) console.log("SCORE Matches:", stats.matches);
        } else if (!isCascade) {
          stats.score += scoreRun(len) * 3;
          if (tracerun) console.log("SCORE: Player run is!", len, scoreRun(len) * 3)
          if (!stats.matches[len]) stats.matches[len] = 0;
          stats.matches[len]++;
        } else {
          let tally = scoreRun(len) * 3;
          stats.score += tally;
          if (tracerun) console.log("SCORE: Cascade run is!", len, tally)
          if (!stats.cascade[len]) stats.cascade[len] = 0;
          stats.cascade[len]++;
        }
      }

      // scoring -------------------
      for (let cell of m.cells) {
        const key = cell.r + "," + cell.c;
        toRemoveMap[key] = { r: cell.r, c: cell.c };
      }
    }

    const toRemove = Object.values(toRemoveMap);
    
    // Emoji scoring + emoji stats
    if (!initialFill) {
      for (let { r, c } of toRemove) {
        const poly = grid[r][c];
        if (poly && poly.emoji) {
          if (!stats.emojis[poly.emoji]) stats.emojis[poly.emoji] = 0;
          stats.emojis[poly.emoji]++;
          let tally = scoreEmoji(poly.emoji);
          stats.score += tally;
          if (tracedebug) console.log("SCORE: Emoji tally is", tally);
        }
      }
    }
    
    // Track whether this match is player or cascade
    if (isCascade) {
      if (tracerun) console.log("Cascading");
      stats.cascadeRuns++;
    } else {
      if (tracerun) console.log("Player run");
      stats.playerRuns++;
      isCascade = true; // all future loops are cascades
    }
    
    if (tracedebug) console.log("STATS:", stats);

    if (!initialFill && toRemove.length > 0) {
      await AnimationSystem.play("vaporize", toRemove, { duration: 300 });
    }

    // remove polygons
    for (let { r, c } of toRemove) {
      grid[r][c] = null;
    }

    applyGravityWithAnimation();
    await waitForFalling();
  }

  busy = false;
}

function applyGravityWithAnimation() {
  falling = []; // clear array

  // Start with empty grid
  let newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (let c = 0; c < COLS; c++) {            //*
    let writeRow = ROWS - 1;                  //*

    for (let r = ROWS - 1; r >= 0; r--) {     //*
      const piece = grid[r][c];
      if (!piece) continue;

      if (writeRow !== r) {
        // This piece falls
        falling.push({
          r: writeRow,
          c,
          piece,
          startY: r * TILE_SIZE,
          endY: writeRow * TILE_SIZE,
          y: r * TILE_SIZE,
          speed: 0.4 // adjust as you like
        });
        newGrid[writeRow][c] = piece;         //*
      } else {
        // This piece stays in place
        newGrid[r][c] = piece;
      }

      writeRow--;                            //*
    }

    // Now fill any remaining cells above with NEW pieces (spawn from top)
    for (let r = writeRow; r >= 0; r--) {
      const piece = randomPolygon();
      newGrid[r][c] = piece;

      // Spawn from above the board and fall into place
      falling.push({
        r,
        c,
        piece,
        startY: -TILE_SIZE,
        endY: r * TILE_SIZE,
        y: -TILE_SIZE,
        speed: 0.4
      });
    }
  }

  grid = newGrid;
}

function swap(a, b) {
  const tmp = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = tmp;
}

function areAdjacent(a, b) {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr + dc === 1);
}

canvas.addEventListener("click", e => {
  if (block.checked && busy) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const c = Math.floor(mx / TILE_SIZE);
  const r = Math.floor(my / TILE_SIZE);

  if (r<0 || r>=ROWS || c<0 || c>=COLS) return;

  if (!selected) {
    selected = {r,c};
  } else {
    const second = {r,c};
    // deselect
    if (selected.r === second.r && selected.c === second.c) {
      selected = null;
      drawGrid();
      return;
    }

    if (!areAdjacent(selected, second)) {
      selected = second;
      drawGrid();
      return;
    }

    if (modeSel.value === "1") {
      const a = grid[selected.r][selected.c];
      const b = grid[second.r][second.c];

      const sameColor = a.color === b.color;
      const sameShape = a.shape === b.shape;

      const allowedSwap = sameColor || sameShape;

      if (!allowedSwap) {
        selected = null;
        drawGrid();
        return;
      }
    }

    // NOW perform the swap
    swap(selected, second);

    const matches = getMatches();
    if (modeSel.value !== "1") {
      // Classic behavior for other modes
      if (matches.length === 0) {
        swap(selected, second); // revert
        selected = null;
        drawGrid();
        return;
      }
    }

    selected = null;
    isCascade = false;
    removeAllMatches();
  }

  drawGrid();
});

window.addEventListener("keydown", e => {
  if (tracedebug) console.log("Keydown", e.key);
  if (block.checked && busy) return;

  if (e.key === "k" || e.key === "K") {
    if (tracedebug) console.log("BOOM!");
    removeAllPieces();
  }

});

function renderStats() {
  let html = "";

  // SCORE
  html += `<div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
             Score: ${stats.score}
           </div>`;

  // Total removed
  html += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
             Removed: ${stats.removed}
           </div>`;
           
  // RUN LENGTHS
  html += `<div style="margin-bottom: 8px;">
             <div style="font-weight: bold;">Run Lengths</div>`;

  if (Object.keys(stats.runs).length === 0) {
    html += `<div style="opacity: 0.6;">No runs yet</div>`;
  } else {
    for (let len in stats.runs) {
      html += `<div>Match of ${len}: ${stats.runs[len]} (${stats.super[len] ?? 0} / ${stats.matches[len] ?? 0} / ${stats.cascade[len] ?? 0}) </div>`;
    }
  }

  html += `</div>`;

  // EMOJIS
  html += `<div>
             <div style="font-weight: bold;">Emoji's</div>`;

  if (Object.keys(stats.emojis).length === 0) {
    html += `<div style="opacity: 0.6;">No emoji's yet</div>`;
  } else {
    for (let emoji in stats.emojis) {
      html += `<div>${emoji}: ${stats.emojis[emoji]}</div>`;
    }
  }

  html += `</div>`;

  scoreEl.innerHTML = html;
}

let lastTime = performance.now();

function loop() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  // Update falling animations
  let stillFalling = false;
  for (let f of falling) {
    if (f.y < f.endY) {
      f.y += f.speed * dt;
      if (f.y > f.endY) f.y = f.endY;
      stillFalling = true;
    }
  }

  drawGrid();
  
  renderStats();

  requestAnimationFrame(loop);
}

function resizeGame() {
  // 1. Read CSS pixel size (stable because CSS controls it)
  const rect = canvas.getBoundingClientRect();
  const cssSize = rect.width; // square board
  const dpr = window.devicePixelRatio || 1;

  // 2. Compute internal resolution
  const internalSize = Math.floor(cssSize * dpr);

  // 3. Only update if needed (prevents feedback loops)
  if (canvas.width !== internalSize || canvas.height !== internalSize) {
    canvas.width = internalSize;
    canvas.height = internalSize;
  }

  // 4. Reset transform and scale to match DPR
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // 5. Recompute TILE_SIZE based on CSS pixels
  TILE_SIZE = cssSize / COLS;

  // 6. Snap falling pieces to new scale
  for (let f of falling) {
    f.startY = f.r * TILE_SIZE;
    f.endY = f.r * TILE_SIZE;
    f.y = f.r * TILE_SIZE;
  }

  // 7. Redraw
  drawGrid();
}


window.addEventListener("resize", resizeGame);


createGrid();
resizeGame(); // initial call
loop();
