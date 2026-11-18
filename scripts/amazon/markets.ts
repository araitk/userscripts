/**
 * Values per supported Amazon domain (the part after "amazon.").
 * - keepa: Keepa domain ID (1-12 match AmazonLocale in the Keepa API; 13 and 14 are the values its extension uses)
 * - seller: Amazon's own seller ID (used for rh=p_6:<ID> in search and ?m=<ID> on product pages). omitted if none
 */
export const MARKETS = {
  com: { keepa: 1, seller: 'ATVPDKIKX0DER' },
  'co.uk': { keepa: 2, seller: 'A3P5ROKL5A1OLE' },
  de: { keepa: 3, seller: 'A3JWKAKR8XB7XF' },
  fr: { keepa: 4, seller: 'A1X6FK5RDHNB96' },
  'co.jp': { keepa: 5, seller: 'AN1VRQENFRJN5' },
  ca: { keepa: 6, seller: 'A3DWYIK6Y9EEQB' },
  it: { keepa: 8, seller: 'A11IL2PNWYJU7H' },
  es: { keepa: 9, seller: 'A1AT7YVPFBWXBL' },
  in: { keepa: 10 },
  'com.mx': { keepa: 11, seller: 'AVDBXBAVVSXLQ' },
  'com.br': { keepa: 12, seller: 'A1ZZFT5FULY4LN' },
  'com.au': { keepa: 13, seller: 'ANEGB3WVEVKZB' },
  nl: { keepa: 14, seller: 'A17D2BRD4YMT0X' },
} as const satisfies Record<string, Market>;

type Market = { keepa: number; seller?: string };

export type CurrentMarket = Market & { tld: string };

/** Values for the current page's domain (tld is the part after "amazon."). undefined if unsupported. */
export function currentMarket(): CurrentMarket | undefined {
  const tld = location.hostname.replace(/^www\.amazon\./, '');
  return Object.hasOwn(MARKETS, tld) ? { ...MARKETS[tld as keyof typeof MARKETS], tld } : undefined;
}
