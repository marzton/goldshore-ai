  function initDocsSearch(wrapper: HTMLElement) {
    const input = wrapper.querySelector('input[type="search"]') as HTMLInputElement;
    const list = wrapper.querySelector('.docs-search-results') as HTMLUListElement;

    if (!input || !list) return;

    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;

    input.addEventListener('input', (e) => {
      clearTimeout(timer);
      if (controller) controller.abort();

      const q = (e.target as HTMLInputElement).value.trim();
      if (!q) {
        list.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      timer = setTimeout(async () => {
        // Show loading state
        list.textContent = '';
        const loading = document.createElement('li');
        loading.className = 'message';
        loading.textContent = 'Searching...';
        list.appendChild(loading);
        input.setAttribute('aria-expanded', 'true');

        controller = new AbortController();
        try {
          const res = await fetch(`/api/docs-search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal
          });
          const data = await res.json();
          list.textContent = ''; // Clear loading

          if (data.length === 0) {
            const li = document.createElement('li');
            li.className = 'message';
            li.textContent = 'No results found';
            list.appendChild(li);
          } else {
            data.forEach((r: { url?: string; title: string }) => {
              const li = document.createElement('li');
              const a = document.createElement('a');

              // Basic protection against javascript: URIs
              if (r.url && !r.url.trim().toLowerCase().startsWith('javascript:')) {
                a.href = r.url;
              } else {
                a.href = '#';
              }

              a.textContent = r.title;
              a.className = 'search-result-link';
              li.appendChild(a);
              list.appendChild(li);
            });
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          list.textContent = '';
          const li = document.createElement('li');
          li.className = 'message error';
          li.textContent = 'Error searching';
          list.appendChild(li);
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target as Node) && !list.contains(e.target as Node)) {
        list.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
      }
    });

    // Keyboard navigation within results
    wrapper.addEventListener('keydown', (e: KeyboardEvent) => {
      const items = Array.from(list.querySelectorAll('a'));
      const activeElement = document.activeElement as HTMLElement;
      const index = items.indexOf(activeElement as HTMLAnchorElement);

      if (e.key === 'ArrowDown') {
        if (items.length > 0) {
          e.preventDefault();
          if (index < items.length - 1) {
            (items[index + 1] as HTMLElement).focus();
          } else if (index === -1) {
            (items[0] as HTMLElement).focus();
          }
        }
      } else if (e.key === 'ArrowUp') {
        if (items.length > 0) {
          e.preventDefault();
          if (index > 0) {
            (items[index - 1] as HTMLElement).focus();
          } else {
            input.focus();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        list.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        input.focus();
      }
    });
  }

  // Initialize all instances
  document.querySelectorAll('.search-wrapper').forEach(wrapper => {
    initDocsSearch(wrapper as HTMLElement);
  });

  // Global Keyboard Shortcut (Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Focus the first visible search input
      const searchInput = document.querySelector('.docs-search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  });
