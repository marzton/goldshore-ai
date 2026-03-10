const initPulsarField = () => {
  const canvas = document.getElementById('pulsar-field') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx) {
    return;
  }

  const particles: Array<{ x: number; y: number; r: number; speed: number; opacity: number }> = [];
  const PARTICLE_COUNT = 60;

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };

  const createParticle = () => ({
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

const initTiltPanels = () => {
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

const initModal = () => {
  const modal = document.getElementById('modal');
  const content = modal?.querySelector('.modal-content');

  const createLabeledField = (
    id: string,
    labelText: string,
    control: HTMLInputElement | HTMLSelectElement,
  ) => {
    const field = document.createElement('div');
    field.className = 'modal-field';

    const label = document.createElement('label');
    label.className = 'modal-label';
    label.htmlFor = id;
    label.textContent = labelText;

    control.id = id;
    control.className = 'modal-input';

    field.append(label, control);
    return field;
  };

  const renderModal = (type: string) => {
    if (!content) {
      return;
    }

    const wrapper = document.createElement('div');
    const heading = document.createElement('h2');
    heading.id = 'modal-title';
    heading.textContent = type === 'admin' ? 'Admin Login' : 'Access High-Fidelity Signals.';
    wrapper.append(heading);

    const supportText = document.createElement('p');
    supportText.id = 'modal-description';
    supportText.className = 'modal-helper';
    supportText.textContent =
      type === 'admin'
        ? 'Enter admin credentials to continue.'
        : 'Get weekly institutional briefings with market structure insights and signal updates.';
    wrapper.append(supportText);

    const email = document.createElement('input');
    email.type = 'email';
    email.name = 'email';
    email.placeholder = 'name@firm.com';
    email.autocomplete = 'email';
    wrapper.append(createLabeledField('modal-email', 'Email', email));

    if (type === 'admin') {
      const password = document.createElement('input');
      password.type = 'password';
      password.placeholder = 'Password';
      wrapper.append(createLabeledField('modal-password', 'Password', password));
    } else {
      const investorType = document.createElement('select');
      investorType.name = 'investorType';
      investorType.innerHTML = [
        '<option value="Institutional">Institutional</option>',
        '<option value="Family Office">Family Office</option>',
        '<option value="High-Net-Worth">High-Net-Worth</option>',
        '<option value="Individual">Individual</option>',
      ].join('');
      wrapper.append(createLabeledField('modal-investor-type', 'Investor Type', investorType));
    }

    const actionButton = document.createElement('button');
    actionButton.className = 'gs-button gs-button--primary';
    actionButton.textContent = type === 'admin' ? 'Login' : 'Join the Briefing';
    wrapper.append(actionButton);

    content.replaceChildren(wrapper);
  };

  document.querySelectorAll<HTMLElement>('[data-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!modal || !content) {
        return;
      }

      const type = button.dataset.modal ?? 'subscribe';
      renderModal(type);
      modal.classList.add('active');
    });
  });

  modal?.querySelectorAll<HTMLElement>('[data-close-modal]').forEach((closeNode) => {
    closeNode.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  });
};

initPulsarField();
initTiltPanels();
initModal();
