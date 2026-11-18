// Copy buttons: put the data-copy value on the clipboard and briefly change the label.
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
