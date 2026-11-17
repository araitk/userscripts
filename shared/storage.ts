import { GM_getValue, GM_setValue } from '$';

/** GM_getValue / GM_setValue を型付きで使うための小さなラッパー。 */
export function createStore<T>(key: string, fallback: T) {
  return {
    get: (): T => GM_getValue<T>(key, fallback),
    set: (value: T): void => GM_setValue(key, value),
  };
}
