/**
 * Live reload for styles during `pnpm dev`.
 *
 * dev/styles/<name>.user.js is a userscript (dev:styles/<name>) that applies the style itself and
 * long-polls dev/styles/<name>.json, which the server holds until the style changes.
 * Only some style managers can reload a style from a URL, so a userscript is used to work with any of them.
 * Pages don't understand @-moz-document, so the sections and their conditions are evaluated in the page.
 */
import type { ServerResponse } from 'node:http';
import { type BuiltStyle, varsRule } from './build-styles.ts';
import { devFile, devName, formatHeader, noStore, parseHeader } from './lib.ts';
import { type Condition, matchPatterns, parseSections, type Section } from './usercss.ts';

/** What the dev server sends to the style dev script (plus its version). */
type StylePayload = { match: string[]; vars: string; sections: Section[] };

type RuntimeConfig = { tag: string; endpoint: string; match: string[] };

/**
 * Runs inside the extension. Serialized with toString, so it must not reference anything outside itself.
 * Long-polls the dev server: each request is held until the style changes, then the CSS is swapped in place.
 */
function runtime({ tag, endpoint, match }: RuntimeConfig) {
  let version = 0;
  let payload: StylePayload | undefined;
  let applied: string | undefined;
  let el: Element | undefined;

  const matches = (c: Condition) => {
    const href = location.href;
    switch (c.type) {
      case 'domain':
        return location.hostname === c.value || location.hostname.endsWith(`.${c.value}`);
      case 'url-prefix':
        return href.startsWith(c.value);
      case 'url':
        return href === c.value;
      case 'regexp':
        try {
          return new RegExp(`^(?:${c.value})$`).test(href);
        } catch {
          return false;
        }
    }
  };

  const render = () => {
    if (!payload) return;
    const parts = payload.sections
      .filter((s) => s.conditions === null || s.conditions.some(matches))
      .map((s) => s.css);
    const css = parts.length ? payload.vars + parts.join('\n') : '';
    if (css === applied) return;
    applied = css;
    el?.remove();
    el = undefined;
    if (!css) return;
    // Duck-typed: the returned node may come from another realm, where instanceof fails
    const added: unknown = typeof GM_addStyle === 'function' ? GM_addStyle(css) : undefined;
    if (typeof (added as Element | undefined)?.remove === 'function') {
      el = added as Element;
    } else {
      const style = document.createElement('style');
      style.textContent = css;
      (document.head ?? document.documentElement).append(style);
      el = style;
    }
  };

  const retry = (...args: unknown[]) => {
    console.error(tag, ...args);
    setTimeout(poll, 3000);
  };

  const poll = () => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `${endpoint}?v=${version}`,
      timeout: 60_000,
      onload(res) {
        if (res.status === 204) {
          poll();
          return;
        }
        if (res.status !== 200) {
          retry(`failed to load (${res.status})`, endpoint);
          return;
        }
        // Keep polling even if this update fails, so later saves still arrive
        try {
          const data = JSON.parse(res.responseText) as StylePayload & { version: number };
          if (version > 0) console.info(`${tag} updated`);
          if (data.match.join() !== match.join()) {
            console.warn(`${tag} the target sites changed; reinstall the dev script`);
          }
          version = data.version;
          payload = data;
          render();
          poll();
        } catch (e) {
          retry('failed to apply', e);
        }
      },
      onerror() {
        retry('failed to load (is pnpm dev running?)', endpoint);
      },
      ontimeout: poll,
    });
  };
  poll();

  // Re-check url-prefix/url/regexp conditions when a single-page app changes the URL
  (window as { navigation?: EventTarget }).navigation?.addEventListener(
    'currententrychange',
    render,
  );
}

/** Header keys of the built .user.css that don't apply to the dev script */
const DROP = new Set(['name', 'updateURL', 'preprocessor', 'var']);

type State = { version: number; json: string; header: [string, string][]; match: string[] };

/**
 * Server side of the live reload. publish() after each build; handle() serves the dev script and
 * the long-poll endpoint (?v=<version the client has>; 204 after HOLD_MS means "no change, ask again").
 */
export function createStyleChannel(origin: string) {
  const HOLD_MS = 25_000; // Must stay below the client's 60s request timeout
  const states = new Map<string, State>();
  const waiters = new Map<string, Set<ServerResponse>>();
  // json is the payload object, so the version is spliced in as its first key
  const send = (res: ServerResponse, s: State) => {
    res.writeHead(200, noStore('application/json'));
    res.end(`{"version":${s.version},${s.json.slice(1)}`);
  };

  const devScript = (name: string, s: State) => {
    const lines: [string, string][] = [
      ['name', devName('styles', name)],
      ...s.header,
      ...s.match.map((m): [string, string] => ['match', m]),
      ['run-at', 'document-start'],
      ['grant', 'GM_xmlhttpRequest'],
      ['grant', 'GM_addStyle'],
      ['connect', new URL(origin).hostname],
    ];
    const config: RuntimeConfig = {
      tag: `[${devName('styles', name)}]`,
      endpoint: `${origin}/${devFile('styles', name, 'json')}`,
      match: s.match,
    };
    return `// ==UserScript==
${formatHeader(lines, '// ')}
// ==/UserScript==

// For development. Applies styles/${name} from the dev server and updates it on every save.
// Disable this in the extension when you're not developing.
(${runtime.toString()})(${JSON.stringify(config)});
`;
  };

  return {
    has: (name: string) => states.has(name),

    publish({ name, meta, css, output }: BuiltStyle) {
      const sections = parseSections(css);
      const payload: StylePayload = {
        match: matchPatterns(sections),
        vars: varsRule(meta.vars ?? []),
        sections,
      };
      const json = JSON.stringify(payload);
      const header = parseHeader(output).filter(([k]) => !DROP.has(k));
      const prev = states.get(name);
      if (prev?.json === json) {
        prev.header = header;
        return;
      }
      // Start from the clock so clients from a previous server run never look up to date
      const version = prev ? prev.version + 1 : Date.now();
      const state = { version, json, header, match: payload.match };
      states.set(name, state);
      for (const res of waiters.get(name) ?? []) send(res, state);
      waiters.delete(name);
    },

    /** Forgets a style whose folder is gone, so its dev script gets 404 instead of stale CSS. */
    remove(name: string) {
      if (!states.delete(name)) return;
      for (const res of waiters.get(name) ?? []) res.writeHead(404).end('not found');
      waiters.delete(name);
    },

    /** Serves dev/styles/<name>.user.js (the dev script) or dev/styles/<name>.json (long-poll). */
    handle(name: string, ext: string, query: URLSearchParams, res: ServerResponse) {
      const state = states.get(name);
      if (!state) {
        res.writeHead(404).end('not found');
      } else if (ext === 'user.js') {
        res.writeHead(200, noStore('text/javascript; charset=utf-8'));
        res.end(devScript(name, state));
      } else if (Number(query.get('v')) !== state.version) {
        send(res, state);
      } else {
        const set = waiters.get(name) ?? new Set();
        waiters.set(name, set);
        set.add(res);
        const timer = setTimeout(() => {
          set.delete(res);
          res.writeHead(204).end();
        }, HOLD_MS);
        res.on('close', () => {
          clearTimeout(timer);
          set.delete(res);
        });
      }
    },
  };
}
