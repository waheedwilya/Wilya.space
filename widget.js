(function () {
  const css = `
    .wly-hero{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;padding:24px;border-radius:24px;background:linear-gradient(180deg,#0b1020 0%,#0f172a 100%);color:#e5e7eb;box-shadow:0 20px 40px rgba(0,0,0,.35)}
    .wly-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:20px}
    .wly-title{font-size:28px;font-weight:800;margin:0;color:#fff}
    .wly-sub{font-size:16px;opacity:.9;margin-top:8px}
    .wly-kpis{display:flex;gap:12px}
    .wly-kpi{background:#0b1220;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;min-width:100px;text-align:center}
    .wly-kv{font-size:18px;font-weight:800;color:#fff}
    .wly-kl{font-size:11px;color:#9ca3af}
    .wly-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
    @media (max-width:980px){.wly-grid{grid-template-columns:1fr}}
    .wly-card{background:#0b1220;border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden}
    .wly-ch{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
    .wly-ch h2{margin:0;font-size:16px;font-weight:700;color:#fff}
    .wly-hint{color:#9ca3af;font-size:12px}
    .wly-list{padding:8px;max-height:380px;overflow:auto}
    .wly-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.06);border-radius:12px;margin:8px;background:transparent}
    .wly-row:hover{background:rgba(255,255,255,.03)}
    .wly-row.wly-active{outline:2px solid #60a5fa;background:rgba(96,165,250,.08)}
    .wly-rt{font-weight:700;color:#fff}
    .wly-rs{color:#a1a1aa;font-size:12px;margin-top:2px;display:flex;gap:6px;flex-wrap:wrap}
    .wly-right{display:flex;align-items:center;margin-left:auto;flex-wrap:wrap;gap:6px}
    .wly-badge{padding:2px 8px;border-radius:999px;font-size:12px;white-space:nowrap}
    .wly-b-neutral{background:#eef2ff;color:#3730a3}
    .wly-b-green{background:#ecfdf5;color:#065f46}
    .wly-b-amber{background:#fffbeb;color:#92400e}
    .wly-b-red{background:#fef2f2;color:#991b1b}
    .wly-b-blue{background:#eff6ff;color:#1e3a8a}
    .wly-btn{border:1px solid rgba(255,255,255,.2);background:#2563eb;color:#fff;font-weight:700;padding:8px 12px;border-radius:12px;cursor:pointer}
    .wly-btn:hover{filter:brightness(1.05)}
    .wly-btn:disabled{background:#374151;cursor:not-allowed}
    .wly-ghost{background:transparent;color:#e5e7eb;border:1px solid rgba(229,231,235,.2)}
    .wly-lg{padding:12px 16px;font-size:14px}
    .wly-cta{display:flex;gap:12px;justify-content:center;margin-top:18px}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const JOBS = [
    { id:"J1", title:"Packaging Line A", req:["Packaging","Safety"], shift:"Morning", loc:"Plant 5" },
    { id:"J2", title:"Extrusion Machine 2", req:["Extrusion","Setup","Safety"], shift:"Afternoon", loc:"Plant 5" },
    { id:"J3", title:"QC Inspection", req:["QC","Documentation"], shift:"Night", loc:"Plant 4" },
    { id:"J4", title:"Palletizing", req:["Forklift","Packaging"], shift:"Morning", loc:"Warehouse" },
  ];
  const WORKERS = [
    { id:"W1", name:"Alex Kim", skills:["Packaging","Safety","Palletizing"], shifts:["Morning","Afternoon"], jobs:[] },
    { id:"W2", name:"Priya Shah", skills:["QC","Documentation","Safety"], shifts:["Night"], jobs:[] },
    { id:"W3", name:"Diego Rivera", skills:["Extrusion","Setup","Maintenance"], shifts:["Afternoon"], jobs:[] },
    { id:"W4", name:"Maya Singh", skills:["Forklift","Packaging","Safety"], shifts:["Morning","Night"], jobs:[] },
    { id:"W5", name:"Ben Carter", skills:["Packaging"], shifts:["Morning"], jobs:[] },
  ];

  const el = document.getElementById('wilya-hero-widget');
  if (!el) return;

  // state (simple)
  let jobs = JSON.parse(JSON.stringify(JOBS));
  let workers = JSON.parse(JSON.stringify(WORKERS));
  let selectedId = jobs[0]?.id;

  function score(job, w) {
    const skillMatches = job.req.filter(s => w.skills.includes(s)).length;
    const skillScore = Math.round((skillMatches / job.req.length) * 100);
    const availScore = w.shifts.includes(job.shift) ? 100 : 0;
    const total = Math.round(skillScore * 0.7 + availScore * 0.3);
    return { skillScore, availScore, total };
  }
  const badge = (t, c="neutral") => `<span class="wly-badge wly-b-${c}">${t}</span>`;

  function coverage() {
    const total = jobs.length;
    const filled = jobs.filter(j=>j.wid).length;
    const pct = total===0?100:Math.round(filled/total*100);
    return { total, filled, unfilled: total - filled, pct };
  }

  function assign(jobId, workerId) {
    jobs = jobs.map(j => j.id===jobId ? {...j, wid: workerId} : j);
    workers = workers.map(w => w.id===workerId ? {...w, jobs:[...(w.jobs||[]), jobId]} : w);
    render();
  }
  function unassign(jobId) {
    const job = jobs.find(j=>j.id===jobId); if(!job?.wid) return;
    const wid = job.wid;
    jobs = jobs.map(j => j.id===jobId ? {...j, wid: undefined} : j);
    workers = workers.map(w => w.id===wid ? {...w, jobs:(w.jobs||[]).filter(id=>id!==jobId)} : w);
    render();
  }

  function render() {
    const cov = coverage();
    const job = jobs.find(j=>j.id===selectedId);
    const ranked = job ? workers
      .map(w => ({ w, s: score(job, w) }))
      .sort((a,b)=>b.s.total - a.s.total) : [];

    el.innerHTML = `
      <div class="wly-hero">
        <div class="wly-head">
          <div>
            <h1 class="wly-title">Right person. Right job. Right now.</h1>
            <p class="wly-sub">Match open jobs to available, skilled associates in seconds.</p>
          </div>
          <div class="wly-kpis">
            <div class="wly-kpi"><div class="wly-kv">${cov.pct}%</div><div class="wly-kl">Coverage</div></div>
            <div class="wly-kpi"><div class="wly-kv">${cov.filled}/${cov.total}</div><div class="wly-kl">Jobs Filled</div></div>
            <div class="wly-kpi"><div class="wly-kv">${cov.unfilled}</div><div class="wly-kl">Unfilled</div></div>
          </div>
        </div>

        <div class="wly-grid">
          <div class="wly-card">
            <div class="wly-ch"><h2>Open Jobs</h2><div class="wly-hint">Select a job to see best matches</div></div>
            <div class="wly-list">
              ${jobs.map(j => `
                <button class="wly-row ${j.id===selectedId?'wly-active':''}" data-type="select" data-id="${j.id}">
                  <div>
                    <div class="wly-rt">${j.title}</div>
                    <div class="wly-rs">${j.loc} • ${j.shift} shift</div>
                  </div>
                  <div class="wly-right">
                    ${j.req.map(s=>badge(s)).join('')}
                    ${j.wid ? badge('Assigned','green') : badge('Open','amber')}
                  </div>
                </button>`).join('')}
            </div>
          </div>

          <div class="wly-card">
            <div class="wly-ch"><h2>Best Matches</h2>
              <div class="wly-hint">${job ? `${job.title} • Needs ${job.req.join(', ')} • ${job.shift}` : 'No job selected'}</div>
            </div>
            <div class="wly-list">
              ${job ? ranked.map(({w,s})=>`
                <div class="wly-row">
                  <div>
                    <div class="wly-rt">${w.name}</div>
                    <div class="wly-rs">${w.skills.slice(0,6).map(x=>badge(x, job.req.includes(x)?'blue':'neutral')).join('')}</div>
                  </div>
                  <div class="wly-right">
                    ${badge(`${s.total}% fit`, s.total>=80?'green':s.total>=50?'amber':'red')}
                    ${badge(w.shifts.join('/'))}
                    ${
                      job.wid===w.id
                        ? `<button class="wly-btn wly-ghost" data-type="unassign" data-id="${job.id}">Unassign</button>`
                        : job.wid
                          ? `<button class="wly-btn" disabled>Filled</button>`
                          : `<button class="wly-btn" data-type="assign" data-jid="${job.id}" data-wid="${w.id}">Assign</button>`
                    }
                  </div>
                </div>`).join('') : ''}
            </div>
          </div>

          <div class="wly-card">
            <div class="wly-ch"><h2>Roster</h2><div class="wly-hint">Who's available this shift?</div></div>
            <div class="wly-list">
              ${workers.map(w=>`
                <div class="wly-row">
                  <div><div class="wly-rt">${w.name}</div><div class="wly-rs">${w.shifts.join(' / ')}</div></div>
                  <div class="wly-right">${(w.jobs||[]).length>0?badge('Assigned','green'):badge('Free','amber')}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="wly-cta">
          <a href="/pages/contact-us.html" class="wly-btn wly-lg">Talk to Us</a>
          <a href="/pages/resources.html" class="wly-btn wly-ghost wly-lg">Explore Resources</a>
        </div>
      </div>
    `;

    // wire events
    el.querySelectorAll('[data-type="select"]').forEach(btn=>{
      btn.onclick = () => { selectedId = btn.getAttribute('data-id'); render(); };
    });
    el.querySelectorAll('[data-type="assign"]').forEach(btn=>{
      btn.onclick = () => assign(btn.getAttribute('data-jid'), btn.getAttribute('data-wid'));
    });
    el.querySelectorAll('[data-type="unassign"]').forEach(btn=>{
      btn.onclick = () => unassign(btn.getAttribute('data-id'));
    });
  }

  render();
})();

