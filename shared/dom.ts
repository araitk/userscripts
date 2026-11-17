/**
 * selector に一致する要素が現れるまで待つ。SPA で後から描画される要素向け。
 */
export function waitForElement<T extends Element = HTMLElement>(
  selector: string,
  { root = document, timeout = 10_000 }: { root?: ParentNode; timeout?: number } = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    const found = root.querySelector<T>(selector);
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = root.querySelector<T>(selector);
      if (el) {
        cleanup();
        resolve(el);
      }
    });
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`waitForElement: timed out for "${selector}"`));
    }, timeout);
    const cleanup = () => {
      observer.disconnect();
      clearTimeout(timer);
    };

    observer.observe(root === document ? document.documentElement : (root as Node), {
      childList: true,
      subtree: true,
    });
  });
}

/** selector に一致する要素が追加されるたびに callback を呼ぶ（既存の要素にも呼ぶ）。 */
export function onElement<T extends Element = HTMLElement>(
  selector: string,
  callback: (el: T) => void,
  root: ParentNode = document,
): () => void {
  const seen = new WeakSet<Element>();
  const scan = () => {
    for (const el of root.querySelectorAll<T>(selector)) {
      if (seen.has(el)) continue;
      seen.add(el);
      callback(el);
    }
  };
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(root === document ? document.documentElement : (root as Node), {
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}
