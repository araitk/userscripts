/**
 * Reads UserCSS the way style managers do: splits it into @-moz-document sections and
 * works out which pages each one applies to.
 */

export type Condition = { type: 'domain' | 'url-prefix' | 'url' | 'regexp'; value: string };
/** A block of CSS and the @-moz-document conditions it applies under (null = every page). */
export type Section = { conditions: Condition[] | null; css: string };

const ALL_URLS = '*://*/*';

/** Index just past the string or comment starting at i, or i if there is none. */
function skipToken(css: string, i: number): number {
  const c = css[i];
  if (c === '/' && css[i + 1] === '*') {
    const end = css.indexOf('*/', i + 2);
    return end < 0 ? css.length : end + 2;
  }
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1;
    return j + 1;
  }
  return i;
}

function parseConditions(text: string): Condition[] {
  const re =
    /(url-prefix|url|domain|regexp)\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^)]*?))\s*\)/g;
  return [...text.matchAll(re)].map((m) => {
    const quoted = m[2] ?? m[3];
    const value = quoted !== undefined ? quoted.replace(/\\(.)/g, '$1') : (m[4] ?? '');
    return { type: m[1] as Condition['type'], value };
  });
}

/** Splits UserCSS into sections. Rules outside any @-moz-document become one section for every page. */
export function parseSections(css: string): Section[] {
  const sections: Section[] = [];
  let global = '';
  let i = 0;
  while (i < css.length) {
    const skipped = skipToken(css, i);
    if (skipped !== i) {
      // Keep strings, drop comments
      if (css[i] !== '/') global += css.slice(i, skipped);
      i = skipped;
      continue;
    }
    if (css.startsWith('@-moz-document', i)) {
      const open = css.indexOf('{', i);
      if (open < 0) break;
      let depth = 1;
      let j = open + 1;
      while (j < css.length && depth > 0) {
        const next = skipToken(css, j);
        if (next !== j) {
          j = next;
          continue;
        }
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      sections.push({
        conditions: parseConditions(css.slice(i + '@-moz-document'.length, open)),
        css: css.slice(open + 1, j - 1),
      });
      i = j;
      continue;
    }
    global += css[i];
    i++;
  }
  if (global.trim()) sections.unshift({ conditions: null, css: global });
  return sections;
}

/** Turns a URL into a match pattern, or the all-URLs pattern if it can't be expressed. */
function urlPattern(url: string, prefix: boolean): string {
  // A prefix that stops inside the host (e.g. "https://www.you") also matches longer hosts
  if (prefix && !/^https?:\/\/[^/?#]+\//i.test(url)) return ALL_URLS;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || u.port) return ALL_URLS;
    return `${u.protocol}//${u.hostname}${u.pathname}${u.search}${prefix ? '*' : ''}`;
  } catch {
    return ALL_URLS;
  }
}

/** @match patterns covering every page a section can apply to. */
export function matchPatterns(sections: Section[]): string[] {
  const out = new Set<string>();
  for (const s of sections) {
    if (!s.conditions) return [ALL_URLS];
    for (const c of s.conditions) {
      if (c.type === 'domain') {
        out.add(`*://${c.value}/*`);
        out.add(`*://*.${c.value}/*`);
        continue;
      }
      const pattern = c.type === 'regexp' ? ALL_URLS : urlPattern(c.value, c.type === 'url-prefix');
      if (pattern === ALL_URLS) return [ALL_URLS];
      out.add(pattern);
    }
  }
  return [...out];
}
