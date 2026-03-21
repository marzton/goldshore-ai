const WRAPPER_SELECTOR = '.search-wrapper';
const INPUT_SELECTOR = 'input[type="search"]';
const RESULTS_SELECTOR = '.docs-search-results';
const SHORTCUT_INIT_KEY = 'docsSearchShortcutInitialized';

type SearchResult = {
  title: string;
  url?: string;
};

const clearResults = (input: HTMLInputElement, list: HTMLUListElement) => {
  list.replaceChildren();
  input.setAttribute('aria-expanded', 'false');
};

const setMessage = (input: HTMLInputElement, list: HTMLUListElement, message: string, className = 'message') => {
  const item = document.createElement('li');
  item.className = className;
  item.textContent = message;
  list.replaceChildren(item);
  input.setAttribute('aria-expanded', 'true');
};

const renderResults = (input: HTMLInputElement, list: HTMLUListElement, results: SearchResult[]) => {
  if (results.length === 0) {
    setMessage(input, list, 'No results found');
    return;
  }

  const items = results.map((result) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const url = result.url?.trim();

    const lowerUrl = url?.toLowerCase();
    const isUnsafeScheme =
      lowerUrl?.startsWith('javascript:') ||
      lowerUrl?.startsWith('data:') ||
      lowerUrl?.startsWith('vbscript:');

    link.href = url && !isUnsafeScheme ? url : '#';
    link.textContent = result.title;
    link.className = 'search-result-link';

    item.appendChild(link);
    return item;
  });

  list.replaceChildren(...items);
  input.setAttribute('aria-expanded', 'true');
};

const initDocsSearch = (wrapper: HTMLElement) => {
  if (wrapper.dataset.docsSearchInitialized === 'true') {
    return;
  }

  const input = wrapper.querySelector<HTMLInputElement>(INPUT_SELECTOR);
  const list = wrapper.querySelector<HTMLUListElement>(RESULTS_SELECTOR);

  if (!input || !list) {
    return;
  }

  wrapper.dataset.docsSearchInitialized = 'true';

  let timer = 0;
  let controller: AbortController | null = null;

  input.addEventListener('input', (event) => {
    window.clearTimeout(timer);
    controller?.abort();

    const query = (event.target as HTMLInputElement).value.trim();
    if (!query) {
      clearResults(input, list);
      return;
    }

    timer = window.setTimeout(async () => {
      setMessage(input, list, 'Searching...');
      controller = new AbortController();

      try {
        const response = await fetch(`/api/docs-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as SearchResult[];
        renderResults(input, list, data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setMessage(input, list, 'Error searching', 'message error');
      }
    }, 300);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Node && !wrapper.contains(target)) {
      clearResults(input, list);
    }
  });

  wrapper.addEventListener('keydown', (event: KeyboardEvent) => {
    const items = Array.from(list.querySelectorAll<HTMLAnchorElement>('a'));
    const activeElement = document.activeElement;
    const index = activeElement instanceof HTMLAnchorElement ? items.indexOf(activeElement) : -1;

    if (event.key === 'ArrowDown' && items.length > 0) {
      event.preventDefault();
      (items[index + 1] ?? items[0])?.focus();
      return;
    }

    if (event.key === 'ArrowUp' && items.length > 0) {
      event.preventDefault();
      if (index > 0) {
        items[index - 1]?.focus();
      } else {
        input.focus();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      clearResults(input, list);
      input.focus();
    }
  });
};

export const initAllDocsSearch = () => {
  document.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR).forEach(initDocsSearch);
};

export const registerDocsSearchShortcut = () => {
  if (document.documentElement.dataset[SHORTCUT_INIT_KEY] === 'true') {
    return;
  }

  document.documentElement.dataset[SHORTCUT_INIT_KEY] = 'true';

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      const searchInput = document.querySelector<HTMLInputElement>(`${WRAPPER_SELECTOR} .docs-search-input`);
      if (!searchInput) {
        return;
      }

      event.preventDefault();
      searchInput.focus();
    }
  });
};
