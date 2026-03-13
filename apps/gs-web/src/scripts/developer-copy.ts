const copyButtons = document.querySelectorAll<HTMLButtonElement>('[data-copy-target]');

copyButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const targetId = button.dataset.copyTarget;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    const content = target?.textContent?.trim();
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      const original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = original || 'Copy';
      }, 1200);
    } catch {
      button.textContent = 'Copy failed';
    }
  });
});
