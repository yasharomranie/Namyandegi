#!/usr/bin/env node
/**
 * generate-map-labels.mjs
 * -----------------------------------------------------------------------
 * Regenerates the `cx`/`cy`/`r` label-anchor fields in
 * assets/js/provinces-data.js from assets/svg/iran-map.svg.
 *
 * Why: a bounding-box or area centroid is the wrong anchor for a province
 * name label — several provinces (Tehran, Semnan, Gilan, Mazandaran…) are
 * thin, concave, or crescent-shaped enough that their centroid falls
 * outside the shape or on top of a neighboring province. Instead this
 * computes, for each province polygon, the point *inside* it that is
 * farthest from any border (a simple "pole of inaccessibility" grid
 * search) — the same idea Mapbox/Leaflet-style auto-labeling uses. `r` is
 * that point's distance to the nearest edge, used by main.js to size each
 * label to the province it sits in.
 *
 * Run only if iran-map.svg's paths ever change (new province boundaries,
 * a different source map, etc.) — the checked-in values in
 * provinces-data.js don't need to be regenerated otherwise.
 *
 * Usage:
 *   node scripts/generate-map-labels.mjs
 * Prints one line per province ("id: { cx, cy, r }") to paste back into
 * provinces-data.js by hand (keeps the Persian name/count/hasRep edits
 * that live in that file human-authored, not overwritten wholesale).
 *
 * Assumes iran-map.svg's paths use only relative moveto/lineto/closepath
 * commands ("m x,y dx,dy … z"), which is true of the iran-svg-map package
 * this map is sourced from (see the credit comment in iran-map.svg) — no
 * curve commands to worry about.
 * -----------------------------------------------------------------------
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "..", "assets", "svg", "iran-map.svg");
const svg = readFileSync(svgPath, "utf8");

const pathRe = /<path\b[^>]*?\/>/gs;
const idRe = /\bid="([^"]+)"/;
const dRe = /\bd="([^"]+)"/;

const provinces = [];
for (const m of svg.matchAll(pathRe)) {
  const block = m[0];
  const id = block.match(idRe)?.[1];
  const d = block.match(dRe)?.[1];
  if (!id || !d) continue;
  provinces.push({ id, d });
}

function parsePolygons(d) {
  const tokens = d.trim().split(/\s+/);
  const subpaths = [];
  let cur = null;
  let cx = 0, cy = 0;
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "m") {
      i++;
      const [dx, dy] = tokens[i].split(",").map(Number);
      cx += dx; cy += dy;
      cur = [[cx, cy]];
      subpaths.push(cur);
      i++;
    } else if (t === "z") {
      cur = null;
      i++;
    } else {
      const [dx, dy] = t.split(",").map(Number);
      cx += dx; cy += dy;
      if (cur) cur.push([cx, cy]);
      i++;
    }
  }
  return subpaths;
}

function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function bbox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
function pointInPolygon(pt, pts) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function distToSegment(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distToPolygonEdges(pt, ring) {
  let min = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const d = distToSegment(pt, ring[i], ring[(i + 1) % ring.length]);
    if (d < min) min = d;
  }
  return min;
}

// Grid search (coarse-to-fine) for the point inside `mainland` farthest
// from any of its edges.
function bestLabelPoint(subpaths) {
  let mainland = subpaths[0];
  let mainArea = Math.abs(polygonArea(mainland));
  for (const s of subpaths) {
    const a = Math.abs(polygonArea(s));
    if (a > mainArea) { mainArea = a; mainland = s; }
  }
  const bb = bbox(mainland);
  let best = null, bestScore = -Infinity;
  const steps = 40;
  for (let round = 0; round < 4; round++) {
    const shrink = 3 / Math.pow(2, round - 1);
    const rx0 = best ? best[0] - (bb.w / steps) * shrink : bb.minX;
    const rx1 = best ? best[0] + (bb.w / steps) * shrink : bb.maxX;
    const ry0 = best ? best[1] - (bb.h / steps) * shrink : bb.minY;
    const ry1 = best ? best[1] + (bb.h / steps) * shrink : bb.maxY;
    for (let ix = 0; ix <= steps; ix++) {
      for (let iy = 0; iy <= steps; iy++) {
        const x = rx0 + ((rx1 - rx0) * ix) / steps;
        const y = ry0 + ((ry1 - ry0) * iy) / steps;
        if (!pointInPolygon([x, y], mainland)) continue;
        const score = distToPolygonEdges([x, y], mainland);
        if (score > bestScore) { bestScore = score; best = [x, y]; }
      }
    }
  }
  return { point: best, radius: bestScore };
}

console.log(`// Regenerated from ${provinces.length} provinces in iran-map.svg — paste cx/cy/r back into provinces-data.js\n`);
for (const p of provinces) {
  const subpaths = parsePolygons(p.d);
  const { point, radius } = bestLabelPoint(subpaths);
  console.log(`${p.id}: { cx: ${point[0].toFixed(1)}, cy: ${point[1].toFixed(1)}, r: ${radius.toFixed(1)} },`);
}
