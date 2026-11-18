import { GM_getValue, GM_setValue } from '$';

/** Small typed wrapper around GM_getValue / GM_setValue. */
export function createStore<T>(key: string, fallback: T) {
  return {
    get: (): T => GM_getValue<T>(key, fallback),
    set: (value: T): void => GM_setValue(key, value),
  };
}
