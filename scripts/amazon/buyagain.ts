import type { CurrentMarket } from './markets.ts';
import { createKeepaGraph } from './page.ts';

/**
 * Shows the Keepa graph in the product detail side sheet, between the seller info and the buy buttons.
 * Switching variations rebuilds the detail content, so the graph is put back on every DOM change.
 */
export function setupBuyAgainPage(market: CurrentMarket) {
  const graph = createKeepaGraph(market);
  const box = document.createElement('div');
  box.className = 'us-amazon-box';
  box.append(graph.element);

  let current: string | undefined;
  const sync = () => {
    // The buy form's ASIN follows variation switches, unlike the ids of the surrounding nodes
    const input = document.querySelector<HTMLInputElement>(
      '#ride-side-sheet-content input[name="asin"]',
    );
    // The buy buttons row is the child of the detail content that holds the buy form
    const actions = input?.closest('[id^="detailContent-"] > *');
    if (!input?.value || !actions) {
      // The sheet is closed (its content moves back into the grid tile), so take the graph out
      box.remove();
      current = undefined;
      return;
    }
    if (box.nextElementSibling !== actions) actions.before(box);
    if (input.value !== current) {
      current = input.value;
      graph.show(current);
    }
  };

  sync();
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
}
