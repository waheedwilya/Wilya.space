/* Wilya Sandbox — Staffing Planner v2 + Animation (Assign -> fly into slot)
   Adds a small "Available Pool" and animates newly-assigned workers from
   the pool chip to the target job slot using a simple FLIP-style transition.
*/
(function () {
  // ---------- Styles ----------
  const css = `
    .wly-hero{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;padding:24px;border-radius:18px;background:linear-gradient(180deg,var(--bg,#0b1020) 0%,var(--bg-2,#0f172a) 100%);color:var(--text,#e5e7eb);box-shadow:0 20px 40px rgba(0,0,0,.35)}
    .wly-grid{display:grid;grid-template-columns: 1.2fr .9fr;gap:16px}
    @media (max-width:980px){.wly-grid{grid-template-columns:1fr}}
    .pane{background:var(--card,#0b1220);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:14px;overflow:hidden}
    .ph{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}
    .ph h2{margin:0;font-size:16px;font-weight:800;color:var(--text,#fff)}
    .tabs{display:flex;gap:6px;flex-wrap:wrap}
    .tab{border:1px solid var(--border,rgba(255,255,255,.15));background:transparent;color:var(--text,#e5e7eb);padding:6px 10px;border-radius:10px;cursor:pointer;font-weight:700}
    .tab.active{background:var(--accent,#60a5fa);color:#08142c;border-color:transparent}
    .pc{padding:10px 12px}
    table{width:100%;border-collapse:separate;border-spacing:0 8px}
    th, td{font-size:13px}
    th{color:var(--muted,#9ca3af);text-align:left;padding:6px 8px}
    td{padding:6px 8px;background:rgba(255,255,255,.03);border:1px solid var(--border,rgba(255,255,255,.08))}
    td:first-child{border-top-left-radius:10px;border-bottom-left-radius:10px}
    td:last-child{border-top-right-radius:10px;border-bottom-right-radius:10px}
    .group{margin:8px 0 2px;color:var(--muted,#9ca3af);font-weight:700}
    .badge{padding:2px 8px;border-radius:999px;font-size:12px;background:#0d1a34;color:#c7d2fe;border:1px solid var(--border,rgba(255,255,255,.08))}
    .kpis{display:flex;gap:10px;padding:10px 12px}
    .kpi{flex:1;background:rgba(255,255,255,.03);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:10px;text-align:center}
    .kpi .v{font-weight:900;color:var(--text,#fff)}
    .kpi .l{font-size:11px;color:var(--muted,#9ca3af)}
    .slot{display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--border,rgba(255,255,255,.08));border-radius:10px;margin:8px 0;background:rgba(255,255,255,.02)}
    .slot .title{font-weight:800}
    .pill{font-size:12px;padding:2px 8px;border-radius:999px}
    .pill.ok{background:#ecfdf5;color:#065f46}
    .pill.warn{background:#fffbeb;color:#92400e}
    .pill.err{background:#fef2f2;color:#991b1b}
    .controls{display:flex;gap:6px;flex-wrap:wrap}
    input[type="number"]{width:72px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.2));background:#0b1220;color:var(--text,#e5e7eb);padding:6px 8px}
    select{border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.2));background:#0b1220;color:var(--text,#e5e7eb);padding:6px 8px}
    .chk{width:18px;height:18px}
    .legend{display:flex;gap:8px;flex-wrap:wrap;padding:0 12px 12px}

    /* --- Chips (pool + slots) --- */
    .chip{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#0ea5a5;color:#fff;font-weight:900;font-size:12px;box-shadow:0 6px 16px rgba(0,0,0,.25)}
    .chip.dim{opacity:.4;filter:grayscale(.2)}
    .pool{display:flex;flex-wrap:wrap;gap:8px;padding:12px}
    .pool-label{color:var(--muted,#9ca3af);font-size:12px;margin:4px 12px 0}

    /* Floating clone for fly-in animation */
    .chip-fly{position:fixed;left:0;top:0;pointer-events:none;z-index:9999;will-change:transform,opacity;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .45s}
    @media (prefers-reduced-motion: reduce){
      .chip-fly{transition:none}
    }

    /* Brief highlight on landing */
    .land-highlight{box-shadow:0 0 0 0 rgba(96,165,250,.8);animation:land 600ms ease-out}
    @keyframes land{
      0%{box-shadow:0 0 0 0 rgba(96,165,250,.8)}
      100%{box-shadow:0 0 0 8px rgba(96,165,250,0)}
    }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---------- Master data ----------
  const workcenters = [
    { id: 'WC_PROD', name: 'Production' },
    { id: 'WC_WH',   name: 'Warehouse'  },
  ];
  const jobs = [
    { id:'J_CNC',  title:'CNC Machine Operator', wc:'WC_PROD' },
    { id:'J_PACK', title:'Packer',               wc:'WC_PROD' },
    { id:'J_FORK', title:'Forklift Driver',      wc:'WC_WH'   },
    { id:'J_MH',   title:'Material Handler',     wc:'WC_WH'   },
  ];
  const availabilityOptions = ['Available','Vacation','Training'];

  const workers = [
    'Alex Kim','Priya Shah','Diego Rivera','Maya Singh','Ben Carter',
    'Liam Patel','Noah Chen','Sara Lopez','Ivy Brooks','Omar Ali'
  ].map((name, i) => ({
    id: `W${i+1}`, name,
    availability: 'Available'
  }));

  // Default skills matrix
  const skills = {};
  workers.forEach(w => { skills[w.id] = {
    J_CNC:  ['W1','W3','W6','W8'].includes(w.id),
    J_PACK: ['W1','W5','W7','W9','W10'].includes(w.id),
    J_FORK: ['W4','W6','W7','W9'].includes(w.id),
    J_MH:   ['W2','W4','W5','W8','W10'].includes(w.id),
  };});

  // Default demand per job
  const demand = { J_CNC: 2, J_PACK: 2, J_FORK: 1, J_MH: 1 };

  // ---------- State & helpers ----------
  const state = {
    workers: JSON.parse(JSON.stringify(workers)),
    skills: JSON.parse(JSON.stringify(skills)),
    demand: { ...demand },
    prevAssigned: {} // remember prior assignments to detect newly added
  };

  function byId(arr, id){ return arr.find(x=>x.id===id); }
  const initials = (name) => name.split(' ').map(s=>s[0]).join('').toUpperCase();

  // Compute greedy assignment
  function computeAssignments() {
    const availableWorkers = state.workers.filter(w => w.availability === 'Available');
    const canDoCount = Object.fromEntries(availableWorkers.map(w => {
      const count = jobs.reduce((acc, j) => acc + (state.skills[w.id][j.id] ? 1 : 0), 0);
      return [w.id, count];
    }));
    const assigned = {};
    const used = new Set();

    const jobsSorted = [...jobs].sort((a,b)=>{
      const ea = availableWorkers.filter(w => state.skills[w.id][a.id]).length;
      const eb = availableWorkers.filter(w => state.skills[w.id][b.id]).length;
      return (state.demand[b.id]||0) - (state.demand[a.id]||0) || ea - eb;
    });

    for (const job of jobsSorted) {
      const need = Math.max(0, Number(state.demand[job.id] || 0));
      const pool = availableWorkers
        .filter(w => !used.has(w.id) && state.skills[w.id][job.id])
        .sort((a,b) => (canDoCount[a.id]||0) - (canDoCount[b.id]||0));
      assigned[job.id] = [];
      for (let i=0; i<need && i<pool.length; i++){
        const w = pool[i];
        assigned[job.id].push(w.id);
        used.add(w.id);
      }
    }
    const filled = Object.values(assigned).reduce((acc, arr)=> acc + arr.length, 0);
    const needed = Object.values(state.demand).reduce((a,b)=>a+Number(b||0),0);
    return { assigned, filled, needed, unfilled: Math.max(0, needed - filled) };
  }

  // ---------- Animation helpers ----------
  function rect(el){ return el.getBoundingClientRect(); }

  function flyFromTo(srcEl, dstEl) {
    if (!srcEl || !dstEl) return;
    // Respect reduced motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { dstEl.classList.add('land-highlight'); setTimeout(()=>dstEl.classList.remove('land-highlight'), 600); return; }

    const s = rect(srcEl);
    const d = rect(dstEl);

    const clone = srcEl.cloneNode(true);
    clone.classList.add('chip-fly');
    clone.style.transform = `translate(${s.left}px, ${s.top}px)`;
    clone.style.opacity = '1';
    document.body.appendChild(clone);

    // Force reflow, then animate to destination
    void clone.offsetWidth;
    const dx = d.left - s.left;
    const dy = d.top - s.top;
    clone.style.transform = `translate(${s.left + dx}px, ${s.top + dy}px)`;
    clone.style.opacity = '0.2';

    const cleanup = () => {
      clone.remove();
      dstEl.classList.add('land-highlight');
      setTimeout(()=>dstEl.classList.remove('land-highlight'), 600);
    };
    clone.addEventListener('transitionend', cleanup, { once:true });
    setTimeout(cleanup, 550); // safety
  }

  // ---------- Rendering ----------
  const root = document.getElementById('wilya-hero-widget');
  if (!root) return;

  let activeTab = 'skills'; // 'skills' | 'availability' | 'demand'

  function render() {
    const { assigned, filled, needed, unfilled } = computeAssignments();
    const coverage = needed === 0 ? 100 : Math.round((filled/needed)*100);

    // Figure out newly-added assignments compared to last render
    const newPairs = []; // [{wid, jid}]
    for (const j of jobs) {
      const prev = new Set(state.prevAssigned[j.id] || []);
      for (const wid of (assigned[j.id] || [])) {
        if (!prev.has(wid)) newPairs.push({ wid, jid: j.id });
      }
    }

    root.innerHTML = `
      <div class="wly-hero">
        <div class="wly-grid">

          <!-- Left: Config tabs -->
          <div class="pane">
            <div class="ph">
              <h2>Plan for Today</h2>
              <div class="tabs">
                <button class="tab ${activeTab==='skills'?'active':''}" data-tab="skills">Skills Matrix</button>
                <button class="tab ${activeTab==='availability'?'active':''}" data-tab="availability">Worker Availability</button>
                <button class="tab ${activeTab==='demand'?'active':''}" data-tab="demand">Demand</button>
              </div>
            </div>
            <div class="pc">
              ${activeTab==='skills' ? renderSkills() : activeTab==='availability' ? renderAvailability() : renderDemand()}
            </div>
          </div>

          <!-- Right: Assignments -->
          <div class="pane">
            <div class="ph">
              <h2>Auto-Assignment</h2>
              <span class="badge">Greedy, skills- & availability-aware</span>
            </div>

            <!-- Available Pool (source for fly-in) -->
            <div class="pool-label">Available pool</div>
            <div class="pool">
              ${state.workers.map(w=>{
                const isAvail = w.availability === 'Available';
                return `<div class="chip ${isAvail?'':'dim'}" id="pool-${w.id}" title="${w.name}">${initials(w.name)}</div>`;
              }).join('')}
            </div>

            <div class="kpis">
              <div class="kpi"><div class="v">${coverage}%</div><div class="l">Coverage</div></div>
              <div class="kpi"><div class="v">${filled}/${needed}</div><div class="l">Positions Filled</div></div>
              <div class="kpi"><div class="v">${unfilled}</div><div class="l">Unfilled</div></div>
            </div>

            <div class="pc">
              ${workcenters.map(wc => `
                <div class="group">${wc.name}</div>
                ${jobs.filter(j=>j.wc===wc.id).map(j => {
                  const assignees = (assigned[j.id] || []).map(wid => byId(state.workers,wid).name);
                  const need = Number(state.demand[j.id]||0);
                  let pillClass='ok', pillText='OK';
                  if (assignees.length < need) { pillClass='warn'; pillText=\`Need \${need-assignees.length} more\`; }
                  if (need===0) { pillClass='ok'; pillText='No demand'; }
                  if (assignees.length > need) { pillClass='err'; pillText='Overfilled'; }
                  return `
                    <div class="slot">
                      <div>
                        <div class="title">${j.title}</div>
                        <div style="font-size:12px;color:var(--muted,#9ca3af)">Demand: ${need} • Assigned: ${assignees.length}</div>
                      </div>
                      <div class="controls">
                        ${
                          assignees.length
                            ? assignees.map(n=>{
                                const wid = state.workers.find(x=>x.name===n).id;
                                return `<span class="chip" id="slot-${j.id}-${wid}" title="${n}">${initials(n)}</span>`;
                              }).join('')
                            : `<span class="pill warn">—</span>`
                        }
                        <span class="pill ${pillClass}">${pillText}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              `).join('')}
            </div>

            <div class="legend">
              <span class="pill ok">OK</span>
              <span class="pill warn">Under</span>
              <span class="pill err">Over</span>
            </div>
          </div>

        </div>
      </div>
    `;

    // Tab switching
    root.querySelectorAll('[data-tab]').forEach(b=>{
      b.onclick = () => { activeTab = b.getAttribute('data-tab'); render(); };
    });

    // Inputs
    if (activeTab === 'skills') {
      root.querySelectorAll('[data-skill]').forEach(chk=>{
        chk.onchange = () => {
          const wid = chk.getAttribute('data-wid');
          const jid = chk.getAttribute('data-jid');
          state.skills[wid][jid] = chk.checked;
          render();
        };
      });
    } else if (activeTab === 'availability') {
      root.querySelectorAll('[data-avail]').forEach(sel=>{
        sel.onchange = () => {
          const wid = sel.getAttribute('data-wid');
          byId(state.workers, wid).availability = sel.value;
          render();
        };
      });
    } else if (activeTab === 'demand') {
      root.querySelectorAll('[data-demand]').forEach(inp=>{
        inp.oninput = () => {
          const jid = inp.getAttribute('data-jid');
          state.demand[jid] = Math.max(0, Number(inp.value||0));
          render();
        };
      });
    }

    // ---- Run fly-in animations for new assignments ----
    // After DOM is ready, pair each new (wid,jid): animate pool chip -> slot chip
    newPairs.forEach(({wid, jid})=>{
      const src = document.getElementById(`pool-${wid}`);
      const dst = document.getElementById(`slot-${jid}-${wid}`);
      // Slight delay so layout settles
      setTimeout(()=> flyFromTo(src, dst), 30);
    });

    // Save current assignment snapshot for next diff
    state.prevAssigned = Object.fromEntries(jobs.map(j => [j.id, (assigned[j.id]||[]).slice()]));
  }

  // ---------- Tab renderers ----------
  function renderSkills(){
    return `
      ${workcenters.map(wc => `
        <div class="group">${wc.name}</div>
        <div style="overflow:auto">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                ${jobs.filter(j=>j.wc===wc.id).map(j=>`<th>${j.title}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${state.workers.map(w=>`
                <tr>
                  <td>${w.name}</td>
                  ${jobs.filter(j=>j.wc===wc.id).map(j=>`
                    <td style="text-align:center">
                      <input type="checkbox" class="chk"
                        ${state.skills[w.id][j.id] ? 'checked' : ''}
                        data-skill data-wid="${w.id}" data-jid="${j.id}"/>
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
  }

  function renderAvailability(){
    return `
      <div style="overflow:auto">
        <table>
          <thead><tr><th>Worker</th><th>Availability</th></tr></thead>
          <tbody>
            ${state.workers.map(w=>`
              <tr>
                <td>${w.name}</td>
                <td>
                  <select data-avail data-wid="${w.id}">
                    ${['Available','Vacation','Training'].map(a=>`<option ${w.availability===a?'selected':''}>${a}</option>`).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDemand(){
    return `
      ${workcenters.map(wc => `
        <div class="group">${wc.name}</div>
        ${jobs.filter(j=>j.wc===wc.id).map(j=>`
          <div class="slot">
            <div>
              <div class="title">${j.title}</div>
              <div style="font-size:12px;color:var(--muted,#9ca3af)">How many needed today?</div>
            </div>
            <div class="controls">
              <input type="number" min="0" step="1" value="${state.demand[j.id]||0}" data-demand data-jid="${j.id}" />
            </div>
          </div>
        `).join('')}
      `).join('')}
    `;
  }

  // Kick off
  render();
})();
