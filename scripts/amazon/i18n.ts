/** UI strings, matched to the site language (<html lang>). Falls back to English. */
const MESSAGES = {
  en: {
    shortUrl: 'Short URL',
    copyHint: 'Click to copy',
    copied: 'Copied',
    amazonOnly: 'Sold by Amazon only',
    keepaGraph: 'Keepa price history',
  },
  ja: {
    shortUrl: '短縮URL',
    copyHint: 'クリックでコピー',
    copied: 'コピーしました',
    amazonOnly: '販売元をAmazonに限定',
    keepaGraph: 'Keepa の価格推移',
  },
  de: {
    shortUrl: 'Kurz-URL',
    copyHint: 'Zum Kopieren klicken',
    copied: 'Kopiert',
    amazonOnly: 'Nur Verkauf durch Amazon',
    keepaGraph: 'Keepa-Preisverlauf',
  },
  fr: {
    shortUrl: 'URL courte',
    copyHint: 'Cliquer pour copier',
    copied: 'Copié',
    amazonOnly: 'Vendu par Amazon uniquement',
    keepaGraph: 'Historique des prix Keepa',
  },
  it: {
    shortUrl: 'URL breve',
    copyHint: 'Clicca per copiare',
    copied: 'Copiato',
    amazonOnly: 'Solo venduto da Amazon',
    keepaGraph: 'Storico prezzi Keepa',
  },
  es: {
    shortUrl: 'URL corta',
    copyHint: 'Haz clic para copiar',
    copied: 'Copiado',
    amazonOnly: 'Solo vendido por Amazon',
    keepaGraph: 'Historial de precios de Keepa',
  },
  pt: {
    shortUrl: 'URL curta',
    copyHint: 'Clique para copiar',
    copied: 'Copiado',
    amazonOnly: 'Somente vendido pela Amazon',
    keepaGraph: 'Histórico de preços do Keepa',
  },
  nl: {
    shortUrl: 'Korte URL',
    copyHint: 'Klik om te kopiëren',
    copied: 'Gekopieerd',
    amazonOnly: 'Alleen verkocht door Amazon',
    keepaGraph: 'Keepa-prijsgeschiedenis',
  },
} as const;

type Lang = keyof typeof MESSAGES;

/** Strings for the current page language. Only the primary subtag of values like <html lang="ja-jp"> is used. */
export function messages() {
  const base = document.documentElement.lang.toLowerCase().split(/[-_]/)[0] ?? '';
  return Object.hasOwn(MESSAGES, base) ? MESSAGES[base as Lang] : MESSAGES.en;
}
