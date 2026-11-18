import { parseHeader } from './lib.ts';

/** Metadata keys from the built script that the dev script does not carry over */
const DROP = new Set(['name', 'updateURL', 'downloadURL']);

/**
 * Generates the dev script (dev:<name>).
 *
 * On every page load it fetches the watch-built script with GM_xmlhttpRequest and runs it inside the extension.
 * Nothing is injected into the page, so the page's CSP and mixed content (http from an https page) don't apply.
 * Some extensions only expose GM APIs inside the userscript itself, so they are passed to the script as arguments.
 */
export function devLoader(built: string, name: string, origin: string): string {
  const header = parseHeader(built);
  const src = `${origin}/scripts/${name}.user.js`;
  const host = new URL(origin).hostname;

  const lines: [string, string][] = [['name', `dev:${name}`]];
  for (const [key, value] of header) {
    if (DROP.has(key)) continue;
    if (key === 'grant' && value === 'none') continue;
    lines.push([key, value]);
  }
  const has = (key: string, value: string) => lines.some(([k, v]) => k === key && v === value);
  if (!has('grant', 'GM_xmlhttpRequest')) lines.push(['grant', 'GM_xmlhttpRequest']);
  if (!has('connect', host)) lines.push(['connect', host]);

  // GM APIs passed to the script. Some extensions lack some of them, so check with typeof first
  const names = [
    ...new Set([
      'GM',
      'GM_info',
      ...lines.filter(([k, v]) => k === 'grant' && /^GM_\w+$/.test(v)).map(([, v]) => v),
    ]),
  ];
  const apis = [
    ...names.map((n) => `    ${n}: typeof ${n} != 'undefined' ? ${n} : undefined,`),
    `    unsafeWindow: typeof unsafeWindow != 'undefined' ? unsafeWindow : window,`,
  ].join('\n');

  const width = Math.max(...lines.map(([k]) => k.length)) + 2;
  const meta = lines.map(([k, v]) => `// @${k.padEnd(width - 1)}${v}`.trimEnd()).join('\n');

  return `// ==UserScript==
${meta}
// ==/UserScript==

// For development. Loads and runs ${src} on every page load.
// Disable this in the extension when you're not developing.
(() => {
  const src = ${JSON.stringify(src)};
  const apis = {
${apis}
  };
  GM_xmlhttpRequest({
    method: 'GET',
    url: \`\${src}?t=\${Date.now()}\`,
    onload(res) {
      if (res.status !== 200) {
        console.error(\`[dev:${name}] failed to load (\${res.status})\`, src);
        return;
      }
      const body = res.responseText.replace(/^[\\s\\S]*?\\/\\/ ==\\/UserScript==/, '');
      new Function(...Object.keys(apis), \`\${body}\\n//# sourceURL=\${src}\`)(...Object.values(apis));
    },
    onerror(err) {
      console.error('[dev:${name}] failed to load (is pnpm dev running?)', src, err);
    },
  });
})();
`;
}
