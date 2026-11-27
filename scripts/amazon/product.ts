import { GM_setClipboard } from '$';
import { onElement } from '../../shared/dom.ts';
import { messages } from './i18n.ts';
import { amazonOfferUrl, shortUrl } from './links.ts';
import type { CurrentMarket } from './markets.ts';
import { createBar, createKeepaGraph, createLink, getAsin } from './page.ts';

export function setupProductPage(market: CurrentMarket) {
  const t = messages();

  const short = createLink(t.shortUrl);
  short.title = t.copyHint;
  let restoreTimer: ReturnType<typeof setTimeout> | undefined;
  short.addEventListener('click', (e) => {
    // Don't interfere with modified clicks (new tab, download, etc.)
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    GM_setClipboard(short.href, 'text');
    short.textContent = t.copied;
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      short.textContent = t.shortUrl;
    }, 1500);
  });
  const offer = market.seller
    ? { link: createLink(t.amazonOnly), seller: market.seller }
    : undefined;
  const bar = createBar(short, offer?.link);

  const graph = createKeepaGraph(market);

  // Put the links and the graph together below the buy box in the right column
  const box = document.createElement('div');
  box.className = 'us-amazon-box';
  box.append(bar, graph.element);

  let current: string | undefined;
  const update = () => {
    const asin = getAsin();
    if (!asin || asin === current) return;
    current = asin;
    short.href = shortUrl(asin);
    if (offer) offer.link.href = amazonOfferUrl(asin, offer.seller);
    graph.show(asin);
  };

  update();
  // Switching variations replaces the buy box along with the ASIN input in it, so follow each new one.
  // Pages without it show nothing
  onElement('#buybox', (buybox) => {
    buybox.after(box);
    update();
  });
}
