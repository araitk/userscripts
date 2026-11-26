/** Short product URL (https://www.amazon.xx/dp/ASIN). */
export const shortUrl = (asin: string) => `${location.origin}/dp/${asin}`;

/** Product page URL with Amazon's own offer selected. */
export const amazonOfferUrl = (asin: string, seller: string) => `${shortUrl(asin)}?m=${seller}`;

/**
 * Search URL limited to items sold by Amazon.
 * rh is comma-separated (e.g. "p_6:ID,p_n_xxx:yyy"), so other filters are kept and only p_6 is replaced.
 */
export function amazonOnlySearchUrl(search: URL, seller: string) {
  const url = new URL(search);
  const rest = (url.searchParams.get('rh') ?? '')
    .split(',')
    .filter((p) => p && !p.startsWith('p_6:'));
  url.searchParams.set('rh', [`p_6:${seller}`, ...rest].join(','));
  url.searchParams.delete('page');
  return url.toString();
}

export const keepaProductUrl = (keepa: number, asin: string) =>
  `https://keepa.com/#!product/${keepa}-${asin}`;

/** Keepa price history graph image (no API key needed). domain is the part after "amazon." (e.g. co.jp). */
export function keepaGraphUrl(tld: string, asin: string) {
  const params = new URLSearchParams({
    asin,
    domain: tld,
    range: '365',
    width: '240',
  });
  return `https://graph.keepa.com/pricehistory.png?${params}`;
}
