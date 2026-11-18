// 「コピー」ボタン: data-copy の値をクリップボードに入れ、少しの間ラベルを変える。
document.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-copy]');
  if (!button) return;
  await navigator.clipboard.writeText(button.dataset.copy);
  const label = button.textContent;
  button.textContent = 'コピーしました';
  setTimeout(() => {
    button.textContent = label;
  }, 1500);
});
