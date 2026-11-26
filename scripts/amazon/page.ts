const ASIN_IN_PATH = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?#]|$)/i;

/**
 * ASIN of the product page. Prefers the buy form's input#ASIN, which follows variation
 * switches even when the URL keeps the parent ASIN, then the URL, then any ASIN input.
 */
export function getAsin(): string | undefined {
  const own = document.querySelector<HTMLInputElement>('input#ASIN')?.value;
  if (own) return own;
  const fromPath = location.pathname.match(ASIN_IN_PATH)?.[1];
  if (fromPath) return fromPath.toUpperCase();
  return document.querySelector<HTMLInputElement>('input[name="ASIN"]')?.value || undefined;
}

/** Search results live under /s (e.g. /s?k=…, /s/ref=…, /-/en/s?k=…). */
export const isSearchPage = () => /\/s(?:\/|$)/.test(location.pathname);

/**
 * URL of the current search. Safari's tracking protection can hide the query string from
 * location (e.g. after a reload), so prefer the sort form, whose fields carry the current search.
 */
export function currentSearchUrl(): URL {
  const form = document.querySelector<HTMLSelectElement>('#s-result-sort-select')?.form;
  if (!form) return new URL(location.href);
  const url = new URL(form.action);
  for (const [key, value] of new FormData(form)) {
    if (typeof value === 'string') url.searchParams.append(key, value);
  }
  return url;
}

export const isProductPage = () =>
  !!getAsin() && !!document.querySelector('#dp, #dp-container, #ppd');

export function createLink(text: string) {
  const a = document.createElement('a');
  a.textContent = text;
  return a;
}

/** Column of links (one per line). Undefined items are skipped. */
export function createBar(...links: (HTMLElement | undefined)[]) {
  const bar = document.createElement('div');
  bar.className = 'us-amazon-bar';
  bar.append(...links.filter((l) => l !== undefined));
  return bar;
}
