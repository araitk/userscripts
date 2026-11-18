import { GM_setClipboard } from '$';
import { onElement } from '../../shared/dom.ts';
import { messages } from './i18n.ts';
import { amazonOfferUrl, keepaGraphUrl, keepaProductUrl, shortUrl } from './links.ts';
import type { CurrentMarket } from './markets.ts';
import { createBar, createLink, getAsin } from './page.ts';

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

  // Graph image. Clicking it opens the product on Keepa
  const graph = document.createElement('a');
  graph.className = 'us-amazon-keepa';
  graph.target = '_blank';
  graph.rel = 'noopener';
  const img = document.createElement('img');
  img.alt = t.keepaGraph;
  // Hide it if it fails to load (e.g. blocked by Amazon)
  img.addEventListener('error', () => {
    graph.hidden = true;
  });
  graph.append(img);

  // Put the links and the graph together below the buy box in the right column
  const box = document.createElement('div');
  box.className = 'us-amazon-box';
  box.append(bar, graph);

  let current: string | undefined;
  const update = () => {
    const asin = getAsin();
    if (!asin || asin === current) return;
    current = asin;
    short.href = shortUrl(asin);
    if (offer) offer.link.href = amazonOfferUrl(asin, offer.seller);
    graph.href = keepaProductUrl(market.keepa, asin);
    img.src = keepaGraphUrl(market.tld, asin);
    graph.hidden = false;
  };

  update();
  // Switching variations can replace the buy box, so follow each new one. Pages without it show nothing
  onElement('#buybox', (buybox) => {
    buybox.after(box);
    update();
  });
  // Choosing a color or size can change the ASIN without replacing the buy box
  setInterval(update, 1000);
}
