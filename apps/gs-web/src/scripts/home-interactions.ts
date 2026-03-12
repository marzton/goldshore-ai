interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
}

const mountPulsarField = () => {
  const canvas = document.getElementById('pulsar-field') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx) {
    return;
  }

  const particles: Particle[] = [];
  const PARTICLE_COUNT = 60;

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  const createParticle = (): Particle => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 3 + 1,
    speed: Math.random() * 0.3 + 0.05,
    opacity: Math.random() * 0.6 + 0.2,
  });

  const seedParticles = () => {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      particles.push(createParticle());
    }
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.y -= particle.speed;
      if (particle.y < 0) {
        particle.y = canvas.height;
      }

      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.r * 6,
      );

      gradient.addColorStop(0, `rgba(90,140,255,${particle.opacity})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r * 6, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  };

  resize();
  seedParticles();
  animate();

  window.addEventListener('resize', () => {
    resize();
    seedParticles();
  });
};

const mountTiltEffects = () => {
  if (!window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  document.querySelectorAll<HTMLElement>('[data-gs-tilt]').forEach((panel) => {
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      panel.style.transform = `perspective(1200px) rotateX(${y * -12}deg) rotateY(${x * 12}deg)`;
    });

    panel.addEventListener('pointerleave', () => {
      panel.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    });
  });
};

const createEl = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string;
    textContent?: string;
    type?: string;
    placeholder?: string;
  } = {},
) => {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (typeof options.textContent === 'string') {
    element.textContent = options.textContent;
  }
  if ('type' in options && options.type && element instanceof HTMLInputElement) {
    element.type = options.type;
  }
  if ('placeholder' in options && options.placeholder && element instanceof HTMLInputElement) {
    element.placeholder = options.placeholder;
  }
  return element;
};

const renderAdminModal = (content: HTMLElement) => {
  const emailId = 'modal-email';
  const passwordId = 'modal-password';

  const emailLabel = createEl('label', { textContent: 'Email' });
  emailLabel.className = 'modal-label';
  emailLabel.htmlFor = emailId;
  const emailInput = createEl('input', { type: 'email', placeholder: 'name@firm.com' });
  emailInput.className = 'modal-input';
  emailInput.id = emailId;

  const helper = createEl('p', { textContent: 'Enter admin credentials to continue.' });
  helper.id = 'modal-description';
  helper.className = 'modal-helper';

  const passwordLabel = createEl('label', { textContent: 'Password' });
  passwordLabel.className = 'modal-label';
  passwordLabel.htmlFor = passwordId;
  const passwordInput = createEl('input', { type: 'password', placeholder: 'Password' });
  passwordInput.className = 'modal-input';
  passwordInput.id = passwordId;

  content.replaceChildren(
    (() => {
      const heading = createEl('h2', { textContent: 'Admin Login' });
      heading.id = 'modal-title';
      return heading;
    })(),
    helper,
    emailLabel,
    emailInput,
    passwordLabel,
    passwordInput,
    createEl('button', {
      className: 'gs-button gs-button--primary',
      textContent: 'Login',
    }),
  );
};

const renderSubscribeModal = (content: HTMLElement) => {
  const emailId = 'modal-email';
  const investorId = 'modal-investor-type';

  const emailLabel = createEl('label', { textContent: 'Email' });
  emailLabel.className = 'modal-label';
  emailLabel.htmlFor = emailId;
  const emailInput = createEl('input', { type: 'email', placeholder: 'name@firm.com' });
  emailInput.className = 'modal-input';
  emailInput.id = emailId;

  const investorLabel = createEl('label', { textContent: 'Investor Type' });
  investorLabel.className = 'modal-label';
  investorLabel.htmlFor = investorId;
  const investorType = document.createElement('select');
  investorType.id = investorId;
  investorType.className = 'modal-input';
  ['Institutional', 'Family Office', 'High-Net-Worth', 'Individual'].forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    investorType.append(option);
  });

  const support = createEl('p', {
    textContent: 'Get weekly institutional briefings with market structure insights and signal updates.',
  });
  support.id = 'modal-description';
  support.className = 'modal-helper';

  content.replaceChildren(
    (() => {
      const heading = createEl('h2', { textContent: 'Access High-Fidelity Signals.' });
      heading.id = 'modal-title';
      return heading;
    })(),
    support,
    emailLabel,
    emailInput,
    investorLabel,
    investorType,
    createEl('button', {
      className: 'gs-button gs-button--primary',
      textContent: 'Join the Briefing',
    }),
  );
};

const mountModal = () => {
  const modal = document.getElementById('modal');
  const content = modal?.querySelector<HTMLElement>('.modal-content');

  if (!modal || !content) {
    return;
  }

  document.querySelectorAll<HTMLElement>('[data-gs-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.gsModalOpen;
      if (type === 'admin') {
        renderAdminModal(content);
      } else {
        renderSubscribeModal(content);
      }

      modal.classList.add('active');
    });
  });

  modal.querySelectorAll<HTMLElement>('[data-close-modal]').forEach((closeNode) => {
    closeNode.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  });
};

mountPulsarField();
mountTiltEffects();
mountModal();
