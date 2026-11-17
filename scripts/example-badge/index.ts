import { GM_addStyle, GM_registerMenuCommand } from '$';
import { createStore } from '../../shared/storage.ts';

const views = createStore('views', 0);
const count = views.get() + 1;
views.set(count);

GM_addStyle(`
  .us-example-badge {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
    padding: 6px 12px; border-radius: 999px;
    background: #0066cc; color: #fff; font: 600 13px/1.4 system-ui, sans-serif;
  }
`);

const badge = document.createElement('div');
badge.className = 'us-example-badge';
badge.textContent = `userscript OK · ${count} 回目`;
document.body.append(badge);

GM_registerMenuCommand('カウントをリセット', () => {
  views.set(0);
  badge.textContent = 'userscript OK · リセットしました';
});
