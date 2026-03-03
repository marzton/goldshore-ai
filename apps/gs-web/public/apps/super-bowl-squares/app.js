(() => {
  const TEAM_X = 'New England Patriots';
  const TEAM_Y = 'Seattle Seahawks';

  const X0 = [1, 9, 8, 3, 2, 7, 6, 5, 4, 0];
  const Y0 = [6, 8, 1, 3, 9, 5, 4, 7, 0, 2];

  let rotated = false;

  const ALL_BOXES = [
    { name: 'Karen', x: 1, y: 6 }, { name: 'Liserr', x: 9, y: 6 },
    { name: 'Lynn W', x: 8, y: 6 }, { name: 'Cage', x: 3, y: 6 },
    { name: 'Christina A', x: 2, y: 6 }, { name: 'Joey C', x: 7, y: 6 },
    { name: 'Cage', x: 6, y: 6 }, { name: 'Lorraine', x: 5, y: 6 },
    { name: 'Anita', x: 4, y: 6 }, { name: 'Cutlets', x: 0, y: 6 },

    { name: 'Gloria V', x: 1, y: 8 }, { name: 'Shay', x: 9, y: 8 },
    { name: 'Tony', x: 8, y: 8 }, { name: 'Stacy S', x: 3, y: 8 },
    { name: 'Cage', x: 2, y: 8 }, { name: 'Peter', x: 7, y: 8 },
    { name: 'Travis', x: 6, y: 8 }, { name: 'Steve B', x: 5, y: 8 },
    { name: 'Mike L', x: 4, y: 8 }, { name: 'Laura T', x: 0, y: 8 },

    { name: 'Chrissy S', x: 1, y: 1 }, { name: 'Bobby P', x: 9, y: 1 },
    { name: 'Mike Kaan', x: 8, y: 1 }, { name: 'Lisa K', x: 3, y: 1 },
    { name: 'Julie A', x: 2, y: 1 }, { name: 'Lori W', x: 7, y: 1 },
    { name: 'Angela', x: 6, y: 1 }, { name: 'Jenn W', x: 5, y: 1 },
    { name: 'June', x: 4, y: 1 }, { name: 'Steve B', x: 0, y: 1 },

    { name: 'Kouril', x: 1, y: 3 }, { name: 'Niemann', x: 9, y: 3 },
    { name: 'Thomson', x: 8, y: 3 }, { name: 'Cory', x: 3, y: 3 },
    { name: 'Mike Kaan', x: 2, y: 3 }, { name: 'Robby', x: 7, y: 3 },
    { name: 'Mike L', x: 6, y: 3 }, { name: 'Scott W', x: 5, y: 3 },
    { name: 'Jennifer C', x: 4, y: 3 }, { name: 'Nicole M', x: 0, y: 3 },

    { name: 'Big Mike', x: 1, y: 9 }, { name: 'Tom W', x: 9, y: 9 },
    { name: 'Matt B', x: 8, y: 9 }, { name: 'Elliot', x: 3, y: 9 },
    { name: 'Nick G', x: 2, y: 9 }, { name: 'Laura T', x: 7, y: 9 },
    { name: 'Patricia', x: 6, y: 9 }, { name: 'Brian P', x: 5, y: 9 },
    { name: 'Fooley', x: 4, y: 9 }, { name: 'Carmen', x: 0, y: 9 },

    { name: 'Cynthia', x: 1, y: 5 }, { name: 'What What', x: 9, y: 5 },
    { name: 'Laura T', x: 8, y: 5 }, { name: 'Jabrel', x: 3, y: 5 },
    { name: 'Robby', x: 2, y: 5 }, { name: 'Patrick G', x: 7, y: 5 },
    { name: 'Kelli S', x: 6, y: 5 }, { name: 'Lorraine', x: 5, y: 5 },
    { name: 'Cage', x: 4, y: 5 }, { name: 'Lorraine', x: 0, y: 5 },

    { name: 'Patti A', x: 1, y: 4 }, { name: 'Christine H', x: 9, y: 4 },
    { name: 'Mike G', x: 8, y: 4 }, { name: 'John C', x: 3, y: 4 },
    { name: 'Cory', x: 2, y: 4 }, { name: 'Justice', x: 7, y: 4 },
    { name: 'Steve B', x: 6, y: 4 }, { name: 'Travis K', x: 5, y: 4 },
    { name: 'Matt P', x: 4, y: 4 }, { name: 'Steve H', x: 0, y: 4 },

    { name: 'Laura T', x: 1, y: 7 }, { name: 'Lorraine', x: 9, y: 7 },
    { name: 'Dave B', x: 8, y: 7 }, { name: 'Topper', x: 3, y: 7 },
    { name: 'Cathy C', x: 2, y: 7 }, { name: 'Jackie D', x: 7, y: 7 },
    { name: 'Bobby P', x: 6, y: 7 }, { name: 'Eric W', x: 5, y: 7 },
    { name: 'Jack', x: 4, y: 7 }, { name: 'Nick T', x: 0, y: 7 },

    { name: 'Roseann', x: 1, y: 0 }, { name: 'Steve H', x: 9, y: 0 },
    { name: 'Mike McCulleb', x: 8, y: 0 }, { name: 'Cynthia', x: 3, y: 0 },
    { name: 'Gloria', x: 2, y: 0 }, { name: 'Ryan C', x: 7, y: 0 },
    { name: 'June', x: 6, y: 0 }, { name: 'Joey K', x: 5, y: 0 },
    { name: 'Laura T', x: 4, y: 0 }, { name: 'Lynn W', x: 0, y: 0 },

    { name: 'Sandra', x: 1, y: 2 }, { name: 'Gloria V', x: 9, y: 2 },
    { name: 'Cynthia', x: 8, y: 2 }, { name: 'Fooley', x: 3, y: 2 },
    { name: 'Anita', x: 2, y: 2 }, { name: 'Andre', x: 7, y: 2 },
    { name: 'Niemann', x: 6, y: 2 }, { name: 'Gloria V', x: 5, y: 2 },
    { name: 'Travis H', x: 4, y: 2 }, { name: 'Nick G', x: 0, y: 2 }
  ];

  let selectedName = null;
  let selectedSquare = null;
  let liveSquare = null;

  const grid = document.getElementById('grid');
  const nameSelect = document.getElementById('personSelect');
  const rotateBtn = document.getElementById('rotateBtn');
  const pdfBtn = document.getElementById('pdfBtn');
  const xLabel = document.getElementById('xLabel');
  const yLabel = document.getElementById('yLabel');
  const liveStatus = document.getElementById('liveStatus');

  const k = (x, y) => `${x}-${y}`;

  function updateAxisLabels() {
    if (!rotated) {
      xLabel.textContent = TEAM_X;
      yLabel.dataset.text = TEAM_Y;
    } else {
      xLabel.textContent = TEAM_Y;
      yLabel.dataset.text = TEAM_X;
    }
  }

  function initDropdown() {
    const unique = [...new Set(ALL_BOXES.map((b) => b.name))].sort();
    for (const nm of unique) {
      const opt = document.createElement('option');
      opt.value = nm;
      opt.textContent = nm;
      nameSelect.appendChild(opt);
    }
    nameSelect.addEventListener('change', () => {
      selectedName = nameSelect.value || null;
      selectedSquare = null;
      renderGrid();
    });
  }

  function renderGrid() {
    grid.innerHTML = '';

    const map = new Map();
    for (const b of ALL_BOXES) {
      const key = k(b.x, b.y);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b.name);
    }

    const dispX = rotated ? [...Y0] : [...X0];
    const dispY = rotated ? [...X0] : [...Y0];

    const trH = document.createElement('tr');
    trH.innerHTML = `<th></th>${dispX.map((d) => `<th>${d}</th>`).join('')}`;
    grid.appendChild(trH);

    for (const dy of dispY) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="rowhdr">${dy}</td>`;

      for (const dx of dispX) {
        const realX = rotated ? dy : dx;
        const realY = rotated ? dx : dy;

        const td = document.createElement('td');
        td.className = 'cell';
        td.dataset.x = realX;
        td.dataset.y = realY;

        const names = map.get(k(realX, realY)) || [];
        td.textContent = names.join(' & ') || `${realY}-${realX}`;

        if (liveSquare && liveSquare.x === realX && liveSquare.y === realY) {
          td.classList.add('live');
        }

        if (selectedSquare) {
          if (selectedSquare.x === realX && selectedSquare.y === realY) {
            td.classList.add('active');
          }
        } else if (selectedName) {
          if (names.includes(selectedName)) td.classList.add('active');
        }

        td.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedSquare = { x: realX, y: realY };
          selectedName = null;
          nameSelect.value = '';
          renderGrid();
        });

        tr.appendChild(td);
      }

      grid.appendChild(tr);
    }

    updateAxisLabels();
  }

  document.body.addEventListener('click', () => {
    selectedSquare = null;
    selectedName = null;
    nameSelect.value = '';
    renderGrid();
  });

  rotateBtn.addEventListener('click', () => {
    rotated = !rotated;
    renderGrid();
  });

  pdfBtn.addEventListener('click', () => window.print());

  async function pollESPN() {
    try {
      const r = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
        { cache: 'no-store' }
      );
      if (!r.ok) throw new Error('Scoreboard fetch failed');
      const js = await r.json();

      const ev = (js.events || []).find((e) => {
        const comps = e?.competitions?.[0]?.competitors || [];
        const ab = comps.map((c) => c?.team?.abbreviation).filter(Boolean);
        return ab.includes('NE') && ab.includes('SEA');
      });

      if (!ev) {
        liveStatus.textContent = 'LIVE: game not found (yet)';
        return;
      }

      const comp = ev.competitions[0];
      const comps = comp.competitors || [];
      const ne = comps.find((c) => c.team.abbreviation === 'NE');
      const sea = comps.find((c) => c.team.abbreviation === 'SEA');

      const neScore = Number(ne?.score ?? 0);
      const seaScore = Number(sea?.score ?? 0);

      liveSquare = { x: neScore % 10, y: seaScore % 10 };

      const per = comp?.status?.period;
      const clk = comp?.status?.displayClock;
      const state = comp?.status?.type?.state;
      const label = state === 'pre' ? 'PRE' : state === 'in' ? 'LIVE' : state === 'post' ? 'FINAL' : 'LIVE';

      liveStatus.textContent = `${label}: SEA ${seaScore} / NE ${neScore}${per ? ` • Q${per}` : ''}${clk ? ` • ${clk}` : ''}`;

      renderGrid();
    } catch {
      liveStatus.textContent = 'LIVE: unavailable';
    }
  }

  setInterval(pollESPN, 15000);
  pollESPN();

  initDropdown();
  updateAxisLabels();
  renderGrid();
})();
