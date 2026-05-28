#!/usr/bin/env node
// Audit haptic feedback coverage per CLAUDE.md rule 14.
//
// Walks every .tsx file under app/ (excluding app/legacy/) and src/components/
// and flags Pressable / TouchableOpacity components whose onPress handler does
// NOT reference `Haptics.impactAsync` with `Heavy`. Also flags the banned
// `Light` / `Medium` styles.
//
// LIMITATIONS (intentional):
//  • Pure static analysis. Cannot perfectly trace handler delegation across
//    files or through complex closures. Expect some false positives — these
//    surface candidates for manual review.
//  • For named-function handlers (`onPress={handleFoo}`), the script checks
//    whether `handleFoo`'s body in the same file references `Haptics`. If the
//    handler is imported or defined in a parent component, it gets flagged.
//  • Event-stopper handlers (`onPress={(e) => e.stopPropagation()}`) are
//    intentionally skipped.
//  • `onPress={undefined}` is skipped (disabled).
//
// Usage:  node scripts/audit-haptics.mjs

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TARGETS = [
  { dir: path.join(ROOT, 'app'), excludeDirs: ['legacy'] },
  { dir: path.join(ROOT, 'src', 'components'), excludeDirs: [] },
];

function walk(dir, excludeDirs, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (excludeDirs.includes(name)) continue;
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, excludeDirs, acc);
    else if (p.endsWith('.tsx')) acc.push(p);
  }
  return acc;
}

// Find the matching closing brace/bracket starting AT the index of the opening
// char. Handles { } and ( ). Respects strings and template literals to a
// pragmatic degree (no escape-sequence parsing — sufficient for our JSX).
function findMatching(src, openIdx) {
  const open = src[openIdx];
  const close = open === '{' ? '}' : open === '(' ? ')' : null;
  if (!close) return -1;
  let depth = 0;
  let i = openIdx;
  let inStr = null;
  let inBacktick = false;
  while (i < src.length) {
    const c = src[i];
    const prev = i > 0 ? src[i - 1] : '';
    if (inBacktick) {
      if (c === '`' && prev !== '\\') inBacktick = false;
      // skip ${...} template substitutions
      else if (c === '$' && src[i + 1] === '{') {
        const end = findMatching(src, i + 1);
        if (end < 0) return -1;
        i = end;
      }
    } else if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === '`') {
      inBacktick = true;
    } else if (c === "'" || c === '"') {
      inStr = c;
    } else if (c === '/' && src[i + 1] === '/') {
      // line comment — skip to end of line
      const nl = src.indexOf('\n', i);
      if (nl < 0) return -1;
      i = nl;
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return -1;
      i = end + 1;
    } else if (c === open) {
      depth++;
    } else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

// Find the start of the JSX tag's prop block — returns the index of '>' or '/>'
// ending the opener (the prop block content is src[tagStart+1..end]).
function findTagEnd(src, tagStart) {
  let i = tagStart + 1;
  let inStr = null;
  let braceDepth = 0;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && src[i - 1] !== '\\') inStr = null;
    } else if (c === '{') {
      const end = findMatching(src, i);
      if (end < 0) return -1;
      i = end;
    } else if (c === '"' || c === "'") {
      inStr = c;
    } else if (c === '>') {
      return i;
    } else if (c === '/' && src[i + 1] === '>') {
      return i + 1;
    }
    i++;
  }
  return -1;
}

function lineOf(src, idx) {
  return src.slice(0, idx).split('\n').length;
}

// Resolve a function-name reference by searching for its definition in the
// same file and returning its body text. Returns null if not found.
// Handles top-level consts, function declarations, AND class field/method
// patterns (`handleFoo = () => ...` or `handleFoo() { ... }`).
function findFunctionBody(src, name) {
  if (!name) return null;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Top-level / hook-wrapped const declarations — `const NAME = ...`
  // Captures useCallback / useMemo / async / plain arrows uniformly by scanning
  // forward from `=` for the first arrow function or function-keyword start.
  const constRe = new RegExp(`(?:^|[^\\w$])(?:const|let)\\s+${escapedName}\\s*=`, 'm');
  const cm = constRe.exec(src);
  if (cm) {
    const eqIdx = src.indexOf('=', cm.index + cm[0].length - 1);
    if (eqIdx >= 0) {
      // Scan forward up to ~400 chars (handles `useCallback(\n  async () => {`)
      // for the first `=>` and capture the body that follows.
      const window = src.slice(eqIdx + 1, eqIdx + 1 + 4000);
      const arrowIdx = window.search(/=>\s*[{(]?/);
      if (arrowIdx >= 0) {
        const abs = eqIdx + 1 + arrowIdx + 2;
        const next = src.slice(abs).match(/^\s*([{(]?)/);
        if (next && next[1] === '{') {
          const bStart = src.indexOf('{', abs);
          const bEnd = findMatching(src, bStart);
          if (bEnd > 0) return src.slice(bStart + 1, bEnd);
        } else {
          // arrow → expression
          const exprMatch = src.slice(abs).match(/^\s*([^;\n,)]+)/);
          if (exprMatch) return exprMatch[1];
        }
      }
    }
  }
  // function NAME(...) { ... }
  const fnRe = new RegExp(`function\\s+${escapedName}\\s*\\(`);
  const fm = fnRe.exec(src);
  if (fm) {
    const argsStart = src.indexOf('(', fm.index);
    const argsEnd = findMatching(src, argsStart);
    if (argsEnd >= 0) {
      const bStart = src.indexOf('{', argsEnd);
      if (bStart >= 0) {
        const bEnd = findMatching(src, bStart);
        if (bEnd > 0) return src.slice(bStart + 1, bEnd);
      }
    }
  }
  // Class field: `handleFoo = () => ...` or method: `handleFoo() { ... }`
  const classRe = new RegExp(`(?:^|\\n)\\s+${escapedName}\\s*(=\\s*(?:async\\s*)?\\(|\\([^)]*\\)\\s*\\{)`, 'm');
  const xm = classRe.exec(src);
  if (xm) {
    // Find first `{` after the match start — covers both method-body and arrow-body cases.
    const search = src.slice(xm.index);
    const arrowIdx = search.search(/=>\s*\{|\)\s*\{/);
    if (arrowIdx >= 0) {
      const absBrace = src.indexOf('{', xm.index + arrowIdx);
      if (absBrace >= 0) {
        const bEnd = findMatching(src, absBrace);
        if (bEnd > 0) return src.slice(absBrace + 1, bEnd);
      }
    }
  }
  return null;
}

const JS_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'function', 'return', 'await', 'new', 'typeof',
  'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'Number', 'String', 'Array', 'Object', 'Map', 'Set', 'Date', 'Math', 'JSON',
  'Promise', 'parseInt', 'parseFloat', 'Boolean', 'requestAnimationFrame',
  'cancelAnimationFrame', 'Error', 'TypeError', 'do', 'else', 'try', 'catch',
  'finally', 'throw', 'const', 'let', 'var',
]);

const HEAVY_RE = /Haptics\.impactAsync\s*\(\s*Haptics\.ImpactFeedbackStyle\.Heavy\s*\)/;
const ANY_IMPACT_RE = /Haptics\.impactAsync/;
const STOP_PROP_ONLY_RE = /^\s*\(?\s*e\s*\)?\s*=>\s*e\.stopPropagation\(\s*\)\s*$/;

function bodyHasHeavy(body, src) {
  if (!body) return false;
  if (HEAVY_RE.test(body) || ANY_IMPACT_RE.test(body)) return true;
  if (!src) return false;
  // One level of indirection: if the body either CALLS a named function
  // (`handleFoo()`) or REFERENCES one (ternary: `cond ? handleA : handleB`)
  // whose own body fires Heavy, count as covered.
  const visited = new Set();
  const tryName = (fn) => {
    if (!fn || JS_KEYWORDS.has(fn) || visited.has(fn)) return false;
    visited.add(fn);
    const body2 = findFunctionBody(src, fn);
    return !!(body2 && (HEAVY_RE.test(body2) || ANY_IMPACT_RE.test(body2)));
  };
  // Function-call form: `name(`
  let m;
  const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  while ((m = callRe.exec(body)) !== null) {
    if (tryName(m[1])) return true;
  }
  // Bare-reference form: any identifier (used by ternary / conditional handlers
  // like `cond ? handleA : handleB`). Iterates all identifier-shaped tokens
  // and tests each as a potential handler name.
  const refRe = /\b([A-Za-z_$][\w$]*)\b/g;
  while ((m = refRe.exec(body)) !== null) {
    if (tryName(m[1])) return true;
  }
  return false;
}

function auditFile(filepath) {
  const src = fs.readFileSync(filepath, 'utf8');
  const violations = [];
  const lightMedium = [];

  // Light/Medium scan
  const badStyleRe = /Haptics\.ImpactFeedbackStyle\.(Light|Medium)/g;
  let bm;
  while ((bm = badStyleRe.exec(src)) !== null) {
    lightMedium.push({ line: lineOf(src, bm.index), match: bm[0] });
  }

  // Find every <Pressable / <TouchableOpacity tag
  const tagRe = /<(Pressable|TouchableOpacity)\b/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const tagStart = m.index;
    const tagEnd = findTagEnd(src, tagStart);
    if (tagEnd < 0) continue;
    const props = src.slice(tagStart + m[0].length, tagEnd);
    // Extract onPress prop value
    const onPressIdx = props.search(/\bonPress\s*=\s*\{/);
    if (onPressIdx < 0) continue; // no onPress -> not interactive
    const valueStart = props.indexOf('{', onPressIdx);
    const valueEnd = findMatching(props, valueStart);
    if (valueEnd < 0) continue;
    const valueRaw = props.slice(valueStart + 1, valueEnd).trim();

    // Skip explicit `undefined` (disabled)
    if (valueRaw === 'undefined' || valueRaw === 'null') continue;

    // Skip event-stopper pattern
    if (STOP_PROP_ONLY_RE.test(valueRaw)) continue;

    // Inline arrow function?
    const inlineArrow = /^(async\s+)?\(?[^)]*\)?\s*=>\s*[\s\S]+$/.test(valueRaw);
    let hasHeavy = false;
    if (inlineArrow) {
      hasHeavy = bodyHasHeavy(valueRaw, src);
    } else {
      // Function reference: `funcName` or `this.funcName` or `obj.funcName`
      const refMatch = valueRaw.match(/^(?:this\.)?([A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)?$/);
      if (refMatch) {
        const body = findFunctionBody(src, refMatch[1]);
        hasHeavy = bodyHasHeavy(body, src);
      } else {
        hasHeavy = bodyHasHeavy(valueRaw, src);
      }
    }

    if (!hasHeavy) {
      violations.push({
        line: lineOf(src, tagStart),
        tag: m[1],
        onPress: valueRaw.length > 80 ? valueRaw.slice(0, 77) + '...' : valueRaw,
      });
    }
  }

  return { violations, lightMedium };
}

function rel(p) {
  return path.relative(ROOT, p);
}

function main() {
  const files = [];
  for (const t of TARGETS) {
    if (!fs.existsSync(t.dir)) continue;
    walk(t.dir, t.excludeDirs, files);
  }

  let totalViolations = 0;
  let totalLightMedium = 0;
  const fileResults = [];

  for (const f of files) {
    const { violations, lightMedium } = auditFile(f);
    if (violations.length > 0 || lightMedium.length > 0) {
      fileResults.push({ file: f, violations, lightMedium });
    }
    totalViolations += violations.length;
    totalLightMedium += lightMedium.length;
  }

  console.log(`Scanned ${files.length} .tsx files under app/ (excl. legacy) and src/components/`);
  console.log(`Missing Heavy haptics: ${totalViolations}`);
  console.log(`Light/Medium violations (banned): ${totalLightMedium}`);

  if (totalLightMedium > 0) {
    console.log('\n=== LIGHT/MEDIUM VIOLATIONS (BANNED — fix immediately) ===');
    for (const r of fileResults) {
      if (r.lightMedium.length === 0) continue;
      console.log(`\n${rel(r.file)}`);
      for (const v of r.lightMedium) console.log(`  L${v.line}  ${v.match}`);
    }
  }

  if (totalViolations > 0) {
    console.log('\n=== MISSING HEAVY HAPTICS (per file) ===');
    fileResults.sort((a, b) => b.violations.length - a.violations.length);
    for (const r of fileResults) {
      if (r.violations.length === 0) continue;
      console.log(`\n${rel(r.file)}  (${r.violations.length})`);
      for (const v of r.violations) {
        console.log(`  L${String(v.line).padStart(4)}  <${v.tag}> onPress={${v.onPress}}`);
      }
    }
  }

  if (totalViolations === 0 && totalLightMedium === 0) {
    console.log('\n✓ Clean. Every Pressable/TouchableOpacity onPress fires Heavy.');
  }
}

main();
