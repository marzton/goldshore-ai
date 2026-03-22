document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('admin-sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const close = document.getElementById('sidebar-close');
  const previewButtons = document.querySelectorAll('[data-preview]');
  const previewStorageKey = 'gs-admin-preview';

  // Check if overlay exists, else create it
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const openSidebar = () => {
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    toggle?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = () => {
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  toggle?.addEventListener('click', openSidebar);
  close?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  const setPreview = (value) => {
    if (!value || value === 'auto') {
      document.body.removeAttribute('data-preview');
      localStorage.removeItem(previewStorageKey);
    } else {
      document.body.setAttribute('data-preview', value);
      localStorage.setItem(previewStorageKey, value);
    }

    previewButtons.forEach((button) => {
      const isActive = button.dataset.preview === (value || 'auto');
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  previewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setPreview(button.dataset.preview);
    });
  });

  const storedPreview = localStorage.getItem(previewStorageKey);
  setPreview(storedPreview);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('is-open')) {
      closeSidebar();
    }
  });
});
