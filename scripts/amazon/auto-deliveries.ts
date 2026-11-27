import { onElement } from '../../shared/dom.ts';
import type { CurrentMarket } from './markets.ts';
import { asinFromPath, createKeepaGraph } from './page.ts';

/**
 * Shows the Keepa graph at the end of the menu in the subscription detail modal.
 * The modal content (menu included) is rebuilt each time it opens, so add a graph to each new menu.
 */
export function setupAutoDeliveriesPage(market: CurrentMarket) {
  onElement('#sub-action-items', (menu) => {
    // The modal has no ASIN field, only the link to the product page.
    // Its container is the same on the overview and on a delivery's page (?shipId=…), unlike the ids around it
    const link = menu
      .closest('.editSubscriptionContainer')
      ?.querySelector<HTMLAnchorElement>('a[href*="/dp/"]');
    const asin = link && asinFromPath(link.pathname);
    if (!asin) return;
    const graph = createKeepaGraph(market);
    graph.show(asin);
    const box = document.createElement('div');
    box.className = 'us-amazon-box';
    box.append(graph.element);
    menu.append(box);
  });
}
