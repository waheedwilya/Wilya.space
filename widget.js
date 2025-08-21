/* Wilya Staffing Planner v2 + Fly-In (ASCII-safe, no template strings) */
(function () {
  'use strict';

  function onReady(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function(){
    // ---------- CSS (ASCII-only, no backticks) ----------
    var cssLines = [
      ".wly-hero{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;padding:24px;border-radius:18px;background:linear-gradient(180deg,var(--bg,#0b1020) 0%,var(--bg-2,#0f172a) 100%);color:var(--text,#e5e7eb);box-shadow:0 20px 40px rgba(0,0,0,.35)}",
      ".wly-grid{display:grid;grid-template-columns:1.2fr .9fr;gap:16px}",
      "@media (max-width:980px){.wly-grid{grid-template-columns:1fr}}",
      ".pane{background:var(--card,#0b1220);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:14px;overflow:hidden}",
      ".ph{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}",
      ".ph h2{margin:0;font-size:16px;font-weight:800;color:var(--text,#fff)}",
      ".tabs{display:flex;gap:6px;flex-wrap:wrap}",
      ".tab{border:1px solid var(--border,rgba(255,255,255,.15));background:transparent;color:var(--text,#e5e7eb);padding:6px 10px;border-radius:10px;cursor:pointer;font-weight:700}",
      ".tab.active{background:var(--accent,#60a5fa);color:#08142c;border-color:transparent}",
      ".pc{padding:10px 12px}",
      "table{width:100%;border-collapse:separate;border-spacing:0 8px}",
      "th,td{font-size:13px}",
      "th{color:var(--muted,#9ca3af);text-align:left;padding:6px 8px}",
      "td{padding:6px 8px;background:rgba(255,255,255,.03);border:1px solid var(--border,rgba(255,255,255,.08))}",
      "td:first-child{border-top-left-radius:10px;border-bottom-left-radius:10px}",
      "td:last-child{border-top-right-radius:10px;border-bottom-right-radius:10px}",
      ".group{margin:8px 0 2px;color:var(--muted,#9ca3af);font-weight:700}",
      ".badge{padding:2px 8px;border-radius:999px;font-size:12px;background:#0d1a34;color:#c7d2fe;border:1px solid var(--border,rgba(255,255,255,.08))}",
      ".kpis{display:flex;gap:10px;padding:10px 12px}",
      ".kpi{flex:1;background:rgba(255,255,255,.03);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:10px;text-align:center}",
      ".kpi .v{font-weight:900;color:var(--text,#fff)}",
      ".kpi .l{font-size:11px;color:var(--muted,#9ca3af)}",
      ".slot{display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--border,rgba(255,255,255,.08));border-radius:10px;margin:8px 0;background:rgba(255,255,255,.02)}",
      ".slot .title{font-weight:800}",
      ".pill{font-size:12px;padding:2px 8px;border-radius:999px}",
      ".pill.ok{background:#ecfdf5;color:#065f46}",
      ".pill.warn{background:#fffbeb;color:#92400e}",
      ".pill.err{background:#fef2f2;color:#991b1b}",
      ".controls{display:flex;gap:6px;flex-wrap:wrap}",
      "input[type=number]{width:72px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.2));background:#0b1220;color:var(--text,#e5e7eb);padding:6px 8px}",
      "select{border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.2));background:#0b1220;color:var(--text,#e5e7eb);padding:6px 8px}",
      ".chk{width:18px;height:18px}",
      ".legend{display:flex;gap:8px;flex-wrap:wrap;padding:0 12px 12px}",
      /* Chips and pool */
      ".chip{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#0ea5a5;color:#fff;font-weight:900;font-size:12px;box-shadow:0 6px 16px rgba(0,0,0,.25)}",
      ".chip.dim{opacity:.4;filter:grayscale(.2)}",
      ".pool{display:flex;flex-wrap:wrap;gap:8px;padding:12px}",
      ".pool-label{color:var(--muted,#9ca3af);font-size:12px;margin:4px 12px 0}",
      /* Fly animation */
      ".chip-fly{position:fixed;left:0;top:0;pointer-events:none;z-index:9999;will-change:transform,opacity;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .45s}",
      "@media (prefers-reduced-motion:reduce){.chip-fly{transition:none}}",
      ".land-highlight{box-shadow:0 0 0 0 rgba(96,165,250,.8);animation:land 600ms ease-out}",
      "@keyframes land{0%{box-shadow:0 0 0 0 rgba(96,165,250,.8)}100%{box-shadow:0 0 0 8px rgba(96,165,250,0)}}"
    ];
    var style = document.createElement('style');
    style.textContent = cssLines.join('\n');
    document.head.appendChild(style);

    // ---------- Data ----------
    var workcenters = [
      { id: 'WC_PROD', name: 'Production' },
      { id: 'WC_WH',   name: 'Warehouse'  }
    ];
    var jobs = [
      { id:'J_CNC',  title:'CNC Machine Operator', wc:'WC_PROD' },
      { id:'J_PACK', title:'Packer',               wc:'WC_PROD' },
      { id:'J_FORK', title:'Forklift Driver',      wc:'WC_WH'   },
      { id:'J_MH',   title:'Material Handler',     wc:'WC_WH'   }
    ];
    var availabilityOptions = ['Available','Vacation','Training'];
    var workers = [
      'Alex Kim','Priya Shah','Diego Rivera','Maya Singh','Ben Carter',
      'Liam Patel','Noah Chen','Sara Lopez','Ivy Brooks','Omar Ali'
    ].map(function(name, i){ return { id:'W'+(i+1), name:name, availability:'Available' }; });

    var skills = {};
    workers.forEach(function(w){
      skills[w.id] = {
        J_CNC:  ['W1','W3','W6','W8'].indexOf(w.id) >= 0,
        J_PACK: ['W1','W5','W7','W9','W10'].indexOf(w.id) >= 0,
        J_FORK: ['W4','W6','W7','W9'].indexOf(w.id) >= 0,
        J_MH:   ['W2','W4','W5','W8','W10'].indexOf(w.id) >= 0
      };
    });
    var demand = { J_CNC:2, J_PACK:2, J_FORK:1, J_MH:1 };

    // ---------- State ----------
    var state = {
      workers: JSON.parse(JSON.stringify(workers)),
      skills: JSON.parse(JSON.stringify(skills)),
      demand: { J_CNC:2, J_PACK:2, J_FORK:1, J_MH:1 },
      prevAssigned: {}
    };

    // ---------- Helpers ----------
    function byId(arr, id){ for (var i=0;i<arr.length;i++){ if (arr[i].id===id) return arr[i]; } return null; }
    function initials(name){
      var parts = name.split(' ');
      var out = '';
      for (var i=0;i<parts.length;i++){ if (parts[i]) out += parts[i][0].toUpperCase(); }
      return out || '?';
    }

    function computeAssignments(){
      var available = [];
      for (var i=0;i<state.workers.length;i++){
        if (state.workers[i].availability === 'Available') available.push(state.workers[i]);
      }
      var canDoCount = {};
      for (i=0;i<available.length;i++){
        var w = available[i], c = 0;
        for (var j=0;jobs.length;j++){
          var job = jobs[j];
          if (state.skills[w.id][job.id]) c++;
        }
        canDoCount[w.id] = c;
      }

      var assigned = {};
      var used = {};
      var jobsSorted = jobs.slice().sort(function(a,b){
        var ea=0, eb=0, k;
        for (k=0;k<available.length;k++){
          var ww = available[k];
          if (state.skills[ww.id][a.id]) ea++;
          if (state.skills[ww.id][b.id]) eb++;
        }
        var d = (state.demand[b.id]||0) - (state.demand[a.id]||0);
        if (d !== 0) return d;
        return ea - eb;
      });

      for (i=0;i<jobsSorted.length;i++){
        var jx = jobsSorted[i];
        var need = Math.max(0, Number(state.demand[jx.id]||0));
        var pool = [];
        for (var p=0;p<available.length;p++){
          var w2 = available[p];
          if (!used[w2.id] && state.skills[w2.id][jx.id]) pool.push(w2);
        }
        pool.sort(function(a,b){ return (canDoCount[a.id]||0) - (canDoCount[b.id]||0); });
        assigned[jx.id] = [];
        for (var t=0;t<need && t<pool.length; t++){
          var pick = pool[t];
          assigned[jx.id].push(pick.id);
          used[pick.id] = true;
        }
      }
      var filled=0, needed=0;
      for (var jid in assigned){ if (assigned.hasOwnProperty(jid)) filled += assigned[jid].length; }
      for (jid in state.demand){ if (state.demand.hasOwnProperty(jid)) needed += Number(state.demand[jid]||0); }
      return { assigned:assigned, filled:filled, needed:needed, unfilled:Math.max(0, needed-filled) };
    }

    function rect(el){ return el.getBoundingClientRect(); }
    function flyFromTo(srcEl, dstEl){
      if (!srcEl || !dstEl) return;
      var reduce = false;
      if (window.matchMedia){ try{ reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){} }
      if (reduce){
        dstEl.classList.add('land-highlight');
        setTimeout(function(){ dstEl.classList.remove('land-highlight'); }, 600);
        return;
      }
      var s = rect(srcEl), d = rect(dstEl);
      var clone = srcEl.cloneNode(true);
      clone.classList.add('chip-fly');
      clone.style.transform = 'translate(' + s.left + 'px,' + s.top + 'px)';
      clone.style.opacity = '1';
      document.body.appendChild(clone);
      requestAnimationFrame(function(){
        var dx = d.left - s.left, dy = d.top - s.top;
        clone.style.transform = 'translate(' + (s.left+dx) + 'px,' + (s.top+dy) + 'px)';
        clone.style.opacity = '0.2';
        var cleanup = function(){
          if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
          dstEl.classList.add('land-highlight');
          setTimeout(function(){ dstEl.classList.remove('land-highlight'); }, 600);
        };
        clone.addEventListener('transitionend', cleanup, { once:true });
        setTimeout(cleanup, 800);
      });
    }

    var activeTab = 'skills';
    var root = document.getElementById('wilya-hero-widget');
    if (!root){ return; }

    function render(){
      var result = computeAssignments();
      var assigned = result.assigned, filled = result.filled, needed = result.needed, unfilled = result.unfilled;
      var coverage = needed===0 ? 100 : Math.round((filled/needed)*100);

      // detect new assignments
      var newPairs = [];
      for (var i=0;i<jobs.length;i++){
        var jx = jobs[i];
        var prev = {};
        var pa = state.prevAssigned[jx.id] || [];
        for (var a=0;a<pa.length;a++) prev[pa[a]] = true;
        var cur = assigned[jx.id] || [];
        for (var b=0;b<cur.length;b++){
          if (!prev[cur[b]]) newPairs.push({ wid:cur[b], jid:jx.id });
        }
      }

      // Build Tabs content
      var tabHTML = '';
      if (activeTab === 'skills') tabHTML = renderSkills();
      else if (activeTab === 'availability') tabHTML = renderAvailability();
      else tabHTML = renderDemand();

      // Pool
      var poolHTML = '';
      for (i=0;i<state.workers.length;i++){
        var w = state.workers[i];
        var ok = (w.availability === 'Available');
        poolHTML += '<div class="chip ' + (ok? '' : 'dim') + '" id="pool-' + w.id + '" title="' + w.name + '">' + initials(w.name) + '</div>';
      }

      // Assignment board
      var assignHTML = '';
      for (i=0;i<workcenters.length;i++){
        var wc = workcenters[i];
        assignHTML += '<div class="group">' + wc.name + '</div>';
        for (var j=0;j<jobs.length;j++){
          var job = jobs[j];
          if (job.wc !== wc.id) continue;
          var assIds = assigned[job.id] || [];
          var assNames = [];
          for (var k=0;k<assIds.length;k++){
            var ww = byId(state.workers, assIds[k]);
            if (ww) assNames.push(ww.name);
          }
          var need = Number(state.demand[job.id]||0);
          var pillClass = 'ok', pillText = 'OK';
          if (need === 0){ pillClass='ok'; pillText='No demand'; }
          else if (assNames.length < need){ pillClass='warn'; pillText = 'Need ' + (need - assNames.length) + ' more'; }
          else if (assNames.length > need){ pillClass='err'; pillText = 'Overfilled'; }

          var chips = '';
          if (assNames.length){
            for (k=0;k<assNames.length;k++){
              var nm = assNames[k];
              var wid = byId(state.workers, assigned[job.id][k]).id;
              chips += '<span class="chip" id="slot-' + job.id + '-' + wid + '" title="' + nm + '">' + initials(nm) + '</span>';
            }
          } else {
            chips = '<span class="pill warn">—</span>';
          }

          assignHTML += '<div class="slot">' +
            '<div>' +
              '<div class="title">' + job.title + '</div>' +
              '<div style="font-size:12px;color:var(--muted,#9ca3af)">Demand: ' + need + ' • Assigned: ' + assNames.length + '</div>' +
            '</div>' +
            '<div class="controls">' + chips + '<span class="pill ' + pillClass + '">' + pillText + '</span></div>' +
          '</div>';
        }
      }

      // Full DOM
      root.innerHTML =
        '<div class="wly-hero">' +
          '<div class="wly-grid">' +

            '<div class="pane">' +
              '<div class="ph">' +
                '<h2>Plan for Today</h2>' +
                '<div class="tabs">' +
                  '<button class="tab ' + (activeTab==='skills'?'active':'') + '" data-tab="skills">Skills Matrix</button>' +
                  '<button class="tab ' + (activeTab==='availability'?'active':'') + '" data-tab="availability">Worker Availability</button>' +
                  '<button class="tab ' + (activeTab==='demand'?'active':'') + '" data-tab="demand">Demand</button>' +
                '</div>' +
              '</div>' +
              '<div class="pc">' + tabHTML + '</div>' +
            '</div>' +

            '<div class="pane">' +
              '<div class="ph">' +
                '<h2>Auto-Assignment</h2>' +
                '<span class="badge">Greedy, skills- & availability-aware</span>' +
              '</div>' +
              '<div class="pool-label">Available pool</div>' +
              '<div class="pool">' + poolHTML + '</div>' +
              '<div class="kpis">' +
                '<div class="kpi"><div class="v">' + coverage + '%</div><div class="l">Coverage</div></div>' +
                '<div class="kpi"><div class="v">' + filled + '/' + needed + '</div><div class="l">Positions Filled</div></div>' +
                '<div class="kpi"><div class="v">' + unfilled + '</div><div class="l">Unfilled</div></div>' +
              '</div>' +
              '<div class="pc">' + assignHTML + '</div>' +
              '<div class="legend">' +
                '<span class="pill ok">OK</span>' +
                '<span class="pill warn">Under</span>' +
                '<span class="pill err">Over</span>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>';

      // Events
      var tabs = root.querySelectorAll('[data-tab]');
      for (i=0;i<tabs.length;i++){
        tabs[i].onclick = function(){ activeTab = this.getAttribute('data-tab'); render(); };
      }
      if (activeTab === 'skills'){
        var skillInputs = root.querySelectorAll('[data-skill]');
        for (i=0;i<skillInputs.length;i++){
          skillInputs[i].onchange = function(){
            var wid = this.getAttribute('data-wid');
            var jid = this.getAttribute('data-jid');
            state.skills[wid][jid] = !!this.checked;
            render();
          };
        }
      } else if (activeTab === 'availability'){
        var avInputs = root.querySelectorAll('[data-avail]');
        for (i=0;i<avInputs.length;i++){
          avInputs[i].onchange = function(){
            var wid = this.getAttribute('data-wid');
            var w = byId(state.workers, wid);
            if (w) w.availability = this.value;
            render();
          };
        }
      } else if (activeTab === 'demand'){
        var demInputs = root.querySelectorAll('[data-demand]');
        for (i=0;i<demInputs.length;i++){
          demInputs[i].oninput = function(){
            var jid = this.getAttribute('data-jid');
            var v = Number(this.value||0);
            if (v < 0) v = 0;
            state.demand[jid] = v;
            render();
          };
        }
      }

      // Animate new assignments (fly from pool to slot)
      for (i=0;i<newPairs.length;i++){
        (function(pair){
          var src = document.getElementById('pool-' + pair.wid);
          var dst = document.getElementById('slot-' + pair.jid + '-' + pair.wid);
          setTimeout(function(){ flyFromTo(src, dst); }, 30);
        })(newPairs[i]);
      }

      // Snapshot for next diff
      var snap = {};
      for (i=0;i<jobs.length;i++){ snap[jobs[i].id] = (assigned[jobs[i].id]||[]).slice(); }
      state.prevAssigned = snap;
    }

    function renderSkills(){
      var html = '';
      for (var i=0;i<workcenters.length;i++){
        var wc = workcenters[i];
        html += '<div class="group">' + wc.name + '</div>';
        html += '<div style="overflow:auto"><table><thead><tr><th>Worker</th>';
        for (var j=0;j<jobs.length;j++){ if (jobs[j].wc===wc.id) html += '<th>' + jobs[j].title + '</th>'; }
        html += '</tr></thead><tbody>';
        for (var w=0;w<state.workers.length;w++){
          var worker = state.workers[w];
          html += '<tr><td>' + worker.name + '</td>';
          for (j=0;j<jobs.length;j++){
            var job = jobs[j];
            if (job.wc!==wc.id) continue;
            var checked = state.skills[worker.id][job.id] ? ' checked' : '';
            html += '<td style="text-align:center"><input type="checkbox" class="chk" data-skill data-wid="' + worker.id + '" data-jid="' + job.id + '"' + checked + '></td>';
          }
          html += '</tr>';
        }
        html += '</tbody></table></div>';
      }
      return html;
    }


      function renderAvailability(){
        let html = '<div style="overflow:auto"><table><thead><tr><th>Worker</th><th>Availability</th></tr></thead><tbody>';
        for (const w of state.workers){
          html += '<tr><td>' + w.name + '</td><td><select data-avail data-wid="' + w.id + '">';
          for (const opt of availabilityOptions){
            const sel = (w.availability===opt) ? ' selected' : '';
            html += '<option' + sel + '>' + opt + '</option>';
          }
          html += '</select></td></tr>';
        }
        html += '</tbody></table></div>';
        return html;
        }

      function renderDemand(){
        let html = '';
        for (const wc of workcenters){
          html += '<div class="group">' + wc.name + '</div>';
          for (const j of jobs.filter(x=>x.wc===wc.id)){
            html += '<div class="slot"><div><div class="title">' + j.title + '</div>' +
                    '<div style="font-size:12px;color:var(--muted,#9ca3af)">How many needed today?</div></div>' +
                    '<div class="controls"><input type="number" min="0" step="1" value="' + (state.demand[j.id]||0) +
                    '" data-demand data-jid="' + j.id + '"/></div></div>';
          }
        }
        return html;
      }

      // start
      render();
    } catch (e) {
      console.error(e);
      showError(e.message || String(e));
    }
  });
})();
