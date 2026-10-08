#!/usr/bin/env node
/**
 * Enforces the FSD rules from ARCHITECTURE.md on every import in src/:
 *
 *   1. A layer imports only from layers strictly below it (shared ← entities ← features ←
 *      widgets ← pages-layer ← app-layer ← app).
 *   2. Slices of one layer do not import each other.
 *   3. Outside code goes through a slice's public API (`index.ts`) — never its internals.
 *      The single sanctioned exception: `@/entities/<slice>/model`, the framework-free
 *      domain kernel, for `src/server` (docs/adr/0002-shared-domain-rules.md).
 *   4. `src/server` (the mock backend) is reachable only from Next route handlers.
 *   5. Server-safe modules — `shared/lib`, `shared/config`, `entities/<slice>/model` and
 *      `src/server` — import no React / React Query: route handlers load them.
 *
 * Usage: node scripts/check-architecture.mjs   (exit code 1 on any violation)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

/** Lower index = lower layer. */
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages-layer', 'app-layer', 'app'];
const SLICED = new Set(['entities', 'features', 'widgets', 'pages-layer']);

const IMPORT_PATTERN = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** `src/features/save-booking/ui/x.tsx` → { layer: 'features', slice: 'save-booking', rest: ['ui','x.tsx'] } */
function locate(absPath) {
  const parts = relative(SRC, absPath).split(sep);
  const [top, slice, ...rest] = parts;
  if (top === 'server') return { layer: 'server', slice: null, rest: parts.slice(1) };
  if (!LAYERS.includes(top)) return null;
  return SLICED.has(top) ? { layer: top, slice, rest } : { layer: top, slice: null, rest: parts.slice(1) };
}

/** Turns an import specifier into an absolute src path, or null for packages. */
function resolveSpecifier(specifier, fromFile) {
  if (specifier.startsWith('@/')) return join(SRC, specifier.slice(2));
  if (specifier.startsWith('.')) return resolve(fromFile, '..', specifier);
  return null;
}

const FRAMEWORK_PACKAGE = /^(react|react-dom|@tanstack\/|next\/navigation|sonner|react-hook-form)/;

function isServerSafe(location) {
  if (location.layer === 'server') return true;
  if (location.layer === 'shared') return ['lib', 'config'].includes(location.rest[0]);
  return location.layer === 'entities' && location.rest[0] === 'model';
}

const isTest = (file) => /\.(test|spec)\.tsx?$/.test(file);
const violations = [];

for (const file of walk(SRC)) {
  const from = locate(file);
  if (!from) continue;
  const source = readFileSync(file, 'utf8');

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];
    const target = resolveSpecifier(specifier, file);
    if (!target) {
      if (isServerSafe(from) && !isTest(file) && FRAMEWORK_PACKAGE.test(specifier)) {
        violations.push(
          `${relative(ROOT, file)}\n    imports '${specifier}'\n    ✗ server-safe module must stay framework-free`,
        );
      }
      continue;
    }
    const to = locate(target);
    if (!to) continue;
    const report = (rule) =>
      violations.push(`${relative(ROOT, file)}\n    imports '${specifier}'\n    ✗ ${rule}`);

    // Rule 4 — the mock backend.
    if (to.layer === 'server' && from.layer !== 'server') {
      const isRouteHandler = from.layer === 'app' && from.rest[0] === 'api';
      if (!isRouteHandler && !isTest(file)) report('src/server is reachable only from src/app/api route handlers');
      continue;
    }
    if (from.layer === 'server') {
      const kernel = to.layer === 'entities' && to.rest.length === 1 && to.rest[0] === 'model';
      if (to.layer !== 'server' && to.layer !== 'shared' && !kernel) {
        report('src/server may import only shared and entities/<slice>/model');
      }
      if (to.layer === 'shared' && to.rest.length > 1) report('shared is imported by segment: @/shared/<segment>');
      continue;
    }

    const sameSlice = from.layer === to.layer && from.slice === to.slice;
    if (sameSlice) continue; // relative imports inside one slice/segment are free

    // A layer-level barrel (`src/pages-layer/index.ts`) re-exports its slices' public APIs.
    const isLayerBarrel = SLICED.has(from.layer) && from.rest.length === 0;
    if (isLayerBarrel && to.layer === from.layer && to.rest.length === 0) continue;

    // Rule 1 — direction.
    const fromRank = LAYERS.indexOf(from.layer);
    const toRank = LAYERS.indexOf(to.layer);
    if (toRank > fromRank) {
      report(`layer '${from.layer}' cannot import from higher layer '${to.layer}'`);
      continue;
    }

    // Rule 2 — no cross-imports between slices of the same layer.
    if (SLICED.has(from.layer) && from.layer === to.layer) {
      report(`slices of '${from.layer}' cannot import each other (${from.slice} → ${to.slice})`);
      continue;
    }

    // Rule 3 — public API only.
    const deepSliced = SLICED.has(to.layer) && to.rest.length > 0;
    const deepShared = to.layer === 'shared' && to.rest.length > 1;
    const sanctionedStyles = specifier === '@/app-layer/styles/globals.css';
    if ((deepSliced || deepShared) && !sanctionedStyles) {
      report('import through the public API (index.ts) of the slice/segment');
    }
  }
}

if (violations.length > 0) {
  console.error(`FSD: ${violations.length} violation(s)\n`);
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}
console.info('FSD: all imports respect the layer, slice and public-API rules.');
