// Generates the pixel-art name header used in the profile README.
// Usage: node .github/scripts/header.mjs
import { writeFileSync } from 'node:fs';

const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
};

const STAR = ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];

const TEXT = 'ADITYA MANOJ';
const PX = 6;
const PAD = 2; // in pixels

function pixels() {
  const cells = [];
  let x = PAD;
  const y = PAD + 4;
  for (const ch of TEXT) {
    if (ch === ' ') { x += 3; continue; }
    GLYPHS[ch].forEach((row, r) =>
      [...row].forEach((c, col) => c === '#' && cells.push([x + col, y + r])));
    x += 6;
  }
  const textEnd = x - 1;
  const star = [];
  STAR.forEach((row, r) =>
    [...row].forEach((c, col) => c === '#' && star.push([textEnd + 2 + col, PAD + r])));
  return { cells, star, w: textEnd + 9 + PAD + 1, h: y + 7 + PAD + 1 };
}

function svg({ ink, shadow, star, starShadow }) {
  const p = pixels();
  const rect = ([x, y], fill) =>
    `<rect x="${x * PX}" y="${y * PX}" width="${PX}" height="${PX}" fill="${fill}"/>`;
  const shift = ([x, y]) => [x + 1, y + 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w * PX}" height="${p.h * PX}" viewBox="0 0 ${p.w * PX} ${p.h * PX}" shape-rendering="crispEdges" role="img" aria-label="Aditya Manoj">
${p.cells.map((c) => rect(shift(c), shadow)).join('')}
${p.star.map((c) => rect(shift(c), starShadow)).join('')}
${p.cells.map((c) => rect(c, ink)).join('')}
${p.star.map((c) => rect(c, star)).join('')}
</svg>
`;
}

writeFileSync('output/header.svg', svg({ ink: '#2d2a32', shadow: '#d9dce3', star: '#f7c948', starShadow: '#e8d7a3' }));
writeFileSync('output/header-dark.svg', svg({ ink: '#f0eef4', shadow: '#3a3f4b', star: '#f7c948', starShadow: '#5c5030' }));
