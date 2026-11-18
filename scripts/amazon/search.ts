import { onElement } from '../../shared/dom.ts';
import { messages } from './i18n.ts';
import { amazonOnlySearchUrl } from './links.ts';
import type { CurrentMarket } from './markets.ts';
import { createBar, createLink } from './page.ts';

export function setupSearchPage(market: CurrentMarket) {
  const seller = market.seller;
  if (!seller) return;

  const a = createLink(messages().amazonOnly);
  const bar = createBar(a);

  // Filtering or sorting can change the URL without a page load, so build the target when the link is about to be used
  const refresh = () => {
    a.href = amazonOnlySearchUrl(location.href, seller);
  };
  for (const type of ['pointerenter', 'focus']) a.addEventListener(type, refresh);
  // An <a> without href is neither focusable nor styled as a link, so set one up front
  refresh();

  // Put the link at the top of each new filter sidebar, once. Show nothing on pages without it
  onElement('#s-refinements', (sidebar) => sidebar.prepend(bar));
}
