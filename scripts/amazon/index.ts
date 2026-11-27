import { GM_addStyle } from '$';
import { setupAutoDeliveriesPage } from './auto-deliveries.ts';
import { setupBuyAgainPage } from './buyagain.ts';
import { currentMarket } from './markets.ts';
import { isAutoDeliveriesPage, isBuyAgainPage, isProductPage, isSearchPage } from './page.ts';
import { setupProductPage } from './product.ts';
import { setupSearchPage } from './search.ts';

GM_addStyle(`
  .us-amazon-bar {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
    margin-bottom: 8px; font-size: 13px;
  }
  .us-amazon-box { margin: 8px 0 16px; }
  .us-amazon-keepa img { display: block; max-width: 100%; height: auto; }
`);

const market = currentMarket();
if (market) {
  if (isSearchPage()) setupSearchPage(market);
  else if (isBuyAgainPage()) setupBuyAgainPage(market);
  else if (isAutoDeliveriesPage()) setupAutoDeliveriesPage(market);
  else if (isProductPage()) setupProductPage(market);
}
