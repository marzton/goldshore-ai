const sidebarGroupTriggers = Array.from(document.querySelectorAll('[data-sidebar-group-trigger]'));

const updateGroupState = (trigger, expand) => {
  const panelId = trigger.getAttribute('data-panel-id');
  const panel = panelId ? document.getElementById(panelId) : null;
  const group = trigger.closest('.gs-sidebar-group');

  if (!panel || !group) return;

  trigger.setAttribute('aria-expanded', String(expand));
  panel.classList.toggle('is-open', expand);
  group.classList.toggle('is-open', expand);

  if (expand) {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  } else {
    panel.style.maxHeight = '0px';
  }
};

sidebarGroupTriggers.forEach((trigger) => {
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  updateGroupState(trigger, isExpanded);

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    updateGroupState(trigger, !expanded);
  });

  trigger.addEventListener('keydown', (event) => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';

    if (event.key === 'ArrowRight' && !expanded) {
      event.preventDefault();
      updateGroupState(trigger, true);
    }

    if (event.key === 'ArrowLeft' && expanded) {
      event.preventDefault();
      updateGroupState(trigger, false);
    }
  });
});

window.addEventListener('resize', () => {
  sidebarGroupTriggers.forEach((trigger) => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    if (expanded) updateGroupState(trigger, true);
  });
});
