/* Wilya Staffing Planner — CSP‑safe, plain JS (with fly‑in animation via Web Animations API) */
(function () {
  'use strict';

  // DOM ready
  function onReady(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function qs(id){ return document.getElementById(id); }
  function byId(arr, id){ for (var i=0;i<arr.length;i++){ if (arr[i].id===id) return arr[i]; } return null; }
  function initials(name){ var p=name.split(' '), o=''; for (var i=0;i<p.length;i++){ if (p[i]) o+=p[i][0].toUpperCase(); } return o||'?'; }

  onReady(function(){
    var root = qs('wilya-hero-widget');
    if (!root) return;

    // ---------------- Master Data ----------------
    var workcenters = [
      { id:'WC_PROD', name:'Production' },
      { id:'WC_WH',   name:'Warehouse'  }
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
    ].map(function(name,i){ return { id:'W'+(i+1), name:name, availability:'Available' }; });

    var skills = {};
    workers.forEach(function(w){
      skills[w.id] = {
        J_CNC:  ['W1','W3','W6','W8'].indexOf(w.id)>=0,
        J_PACK: ['W1','W5','W7','W9','W10'].indexOf(w.id)>=0,
        J_FORK: ['W4','W6','W7','W9'].indexOf(w.id)>=0,
        J_MH:   ['W2','W4','W5','W8','W10'].indexOf(w.id)>=0
      };
    });

    // starting demand
    var demand = { J_CNC:2, J_PACK:2, J_FORK:1, J_MH:1 };

    // ---------------- State ----------------
    var state = {
      workers: JSON.parse(JSON.stringify(workers)),
      skills:  JSON.parse(JSON.stringify(skills)),
      demand:  { J_CNC:2, J_PACK:2, J_FORK:1, J_MH:1 },
      prevAssigned: {}
    };

    // ---------------- Assignment (Greedy) ----------------
    function computeAssignments(){
      var available = state.workers.filter(function(w){ return w.availability==='Available'; });
      var canDoCount = {};
      for (var i=0;i<available.length;i++){
        var w = available[i], c=0;
        for (var j=0;jobs.length;j++){ if (state.skills[w.id][jobs[j].id]) c++; }
        canDoCount[w.id] = c;
      }
      var used = {};
      var assigned = {};
      var jobsSorted = jobs.slice().sort(function(a,b){
        var ea=0, eb=0;
        for (var k=0;k<available.length;k++){
          var ww=available[k]; if (state.skills[ww.id][a.id]) ea++; if (state.skills[ww.id][b.id]) eb++;
        }
        var d=(state.demand[b.id]||0)-(state.demand[a.id]||0);
        return d!==0 ? d : (ea-eb);
      });
      for (i=0;i<jobsSorted.length;i++){
        var job = jobsSorted[i];
        var need = Math.max(0, Number(state.demand[job.id]||0));
        var pool = available.filter(function(w){ return !used[w.id] && state.skills[w.id][job.id]; })
                            .sort(function(a,b){ return (canDoCount[a.id]||0)-(canDoCount[b.id]||0); });
        assigned[job.id] = [];
        for (var t=0; t<need && t<pool.length; t++){
          var pick = pool[t]; assigned[job.id].push(pick.id); used[pick.id]=true;
        }
      }
      var filled=0, needed=0;
      for (var jid in assigned){ if (assigned.hasOwnProperty(jid)) filled += assigned[jid].length; }
      for (jid in state.demand){ if (state.demand.hasOwnProperty(jid)) needed += Number(state.demand[jid]||0); }
      return { assigned:assigned, filled:filled, needed:needed, unfilled:Math.max(0, needed-filled) };
    }

    // ---------------- Animation: fly from pool to slot (WAAPI) ----------------
    function flyFromPoolToSlot(poolEl, slotEl){
      if (!poolEl || !slotEl) return;
      var reduce=false; try{ reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
      if (reduce){ slotEl.classList.add('land-highlight'); setTimeout(function(){ slotEl.classList.remove('land-highlight'); }, 600); return; }

      var s = poolEl.getBoundingClientRect();
      var d = slotEl.getBoundingClientRect();

      // Create a floating clone (styled via CSS class, not inline)
      var clone = poolEl.cloneNode(true);
      clone.classList.add('chip-fly');
      document.body.appendChild(clone);

      // Position the clone visually using WAAPI transforms (no inline styles needed)
      var keyframes = [
        { transform: 'translate(' + s.left + 'px,' + s.top + 'px)', opacity: 1 },
        { transform: 'translate(' + d.left + 'px,' + d.top + 'px)', opacity: 0.2 }
      ];
      var timing = { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' };
      var anim = clone.animate(keyframes, timing);
      var cleanup = function(){
        if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
        slotEl.classList.add('land-highlight');
        setTimeout(function(){ slotEl.classList.remove('land-highlight'); }, 600);
      };
      anim.addEventListener('finish', cleanup);
      setTimeout(cleanup, 700); // safety
    }

    // ---------------- Rendering ----------------
    var activeTab = 'skills';

    function render(){
      var result = computeAssignments();
      var assigned = result.assigned, filled=result.filled, needed=result.needed, unfilled=result.unfilled;
      var coverage = needed===0 ? 100 : Math.round((filled/needed)*100);

      // detect new (wid,jid) assignments vs previous render
      var newPairs = [];
      for (var i=0;i<jobs.length;i++){
        var jx = jobs[i];
        var prevSet = {};
        var prev = state.prevAssigned[jx.id] || [];
        for (var p=0;p<prev.length;p++) prevSet[prev[p]] = true;
        var cur = assigned[jx.id] || [];
        for (var c=0;c<cur.length;c++){ if (!prevSet[cur[c]]) newPairs.push({ wid:cur[c], jid:jx.id }); }
      }

      // left pane tabs content
      var tabHTML = (activeTab==='skills') ? renderSkills()
                  : (activeTab==='availability') ? renderAvailability()
                  : renderDemand();

      // available pool UI
      var poolHTML = '';
      for (i=0;i<state.workers.length;i++){
        var w=state.workers[i];
        var cls = 'chip' + (w.availability==='Available' ? '' : ' dim');
        poolHTML += '<div class="'+cls+'" id="pool-'+w.id+'" title="'+w.name+'">'+initials(w.name)+'</div>';
      }

      // assignment board
      var boardHTML = '';
      for (i=0;i<workcenters.length;i++){
        var wc = workcenters[i];
        boardHTML += '<div class="group">'+wc.name+'</div>';
        for (var j=0;j<jobs.length;j++){
          var job = jobs[j]; if (job.wc!==wc.id) continue;
          var aIds = assigned[job.id] || [];
          var aNames = aIds.map(function(id){ var ww=byId(state.workers,id); return ww?ww.name:''; });
          var need = Number(state.demand[job.id]||0);
          var badgeClass='ok', badgeText='OK';
          if (need===0){ badgeClass='ok'; badgeText='No demand'; }
          else if (aIds.length<need){ badgeClass='warn'; badgeText='Need '+(need-aIds.length)+' more'; }
          else if (aIds.length>need){ badgeClass='err'; badgeText='Overfilled'; }

          var chips='';
          if (aIds.length){
            for (var k=0;k<aIds.length;k++){
              var wid=aIds[k], nm=aNames[k]||'';
              chips += '<span class="chip" id="slot-'+job.id+'-'+wid+'" title="'+nm+'">'+initials(nm)+'</span>';
            }
          } else {
            chips = '<span class="pill warn">—</span>';
          }

          boardHTML += ''
            + '<div class="slot">'
              + '<div>'
                + '<div class="title">'+job.title+'</div>'
                + '<div class="muted small">Demand: '+need+' • Assigned: '+aIds.length+'</div>'
              + '</div>'
              + '<div class="controls">'+chips+'<span class="pill '+badgeClass+'">'+badgeText+'</span></div>'
            + '</div>';
        }
      }

      // full widget DOM (no inline styles)
      root.classList.add('wly-shell');
      root.innerHTML =
        '<div class="pane">'
          + '<div class="ph">'
            + '<h2>Plan for Today</h2>'
            + '<div class="tabs">'
              + '<button class="tab '+(activeTab==='skills'?'active':'')+'" data-tab="skills">Skills Matrix</button>'
              + '<button class="tab '+(activeTab==='availability'?'active':'')+'" data-tab="availability">Worker Availability</button>'
              + '<button class="tab '+(activeTab==='demand'?'active':'')+'" data-tab="demand">Demand</button>'
            + '</div>'
          + '</div>'
          + '<div class="pc">'+ tabHTML +'</div>'
        + '</div>'
        + '<div class="pane">'
          + '<div class="ph">'
            + '<h2>Auto‑Assignment</h2>'
            + '<span class="badge">Greedy, skills‑ & availability‑aware</span>'
          + '</div>'
          + '<div class="pool-wrap">'
            + '<div class="pool-label">Available pool</div>'
            + '<div class="pool">'+ poolHTML +'</div>'
          + '</div>'
          + '<div class="kpis">'
            + '<div class="kpi"><div class="v">'+coverage+'%</div><div class="l">Coverage</div></div>'
            + '<div class="kpi"><div class="v">'+filled+'/'+needed+'</div><div class="l">Positions Filled</div></div>'
            + '<div class="kpi"><div class="v">'+unfilled+'</div><div class="l">Unfilled</div></div>'
          + '</div>'
          + '<div class="pc">'+ boardHTML +'</div>'
          + '<div class="legend">'
            + '<span class="pill ok">OK</span>'
            + '<span class="pill warn">Under</span>'
            + '<span class="pill err">Over</span>'
          + '</div>'
        + '</div>';

      // events
      var tabs = root.querySelectorAll('[data-tab]');
      for (i=0;i<tabs.length;i++){
        tabs[i].onclick = function(){ activeTab = this.getAttribute('data-tab'); render(); };
      }
      if (activeTab==='skills'){
        var skillInputs = root.querySelectorAll('[data-skill]');
        for (i=0;i<skillInputs.length;i++){
          skillInputs[i].onchange = function(){
            var wid=this.getAttribute('data-wid'), jid=this.getAttribute('data-jid');
            state.skills[wid][jid] = !!this.checked; render();
          };
        }
      } else if (activeTab==='availability'){
        var avInputs = root.querySelectorAll('[data-avail]');
        for (i=0;i<avInputs.length;i++){
          avInputs[i].onchange = function(){
            var wid=this.getAttribute('data-wid'), w=byId(state.workers,wid);
            if (w) w.availability=this.value; render();
          };
        }
      } else if (activeTab==='demand'){
        var demInputs = root.querySelectorAll('[data-demand]');
        for (i=0;i<demInputs.length;i++){
          demInputs[i].oninput = function(){
            var jid=this.getAttribute('data-jid'), v=Number(this.value||0);
            if (v<0) v=0; state.demand[jid]=v; render();
          };
        }
      }

      // run fly‑in animations for new pairs
      for (i=0;i<newPairs.length;i++){
        (function(pair){
          var src = qs('pool-'+pair.wid);
          var dst = qs('slot-'+pair.jid+'-'+pair.wid);
          setTimeout(function(){ flyFromPoolToSlot(src, dst); }, 40);
        })(newPairs[i]);
      }

      // snapshot
      var snap={}; for (i=0;i<jobs.length;i++){ snap[jobs[i].id]=(assigned[jobs[i].id]||[]).slice(); }
      state.prevAssigned = snap;
    }

    // ------------ Tab renderers (no inline styles) ------------
    function renderSkills(){
      var html=''; for (var i=0;i<workcenters.length;i++){
        var wc=workcenters[i];
        html += '<div class="group">'+wc.name+'</div>';
        html += '<div class="table-wrap"><table><thead><tr><th>Worker</th>';
        for (var j=0;j<jobs.length;j++){ if (jobs[j].wc===wc.id) html += '<th>'+jobs[j].title+'</th>'; }
        html += '</tr></thead><tbody>';
        for (var w=0;w<state.workers.length;w++){
          var worker=state.workers[w];
          html += '<tr><td>'+worker.name+'</td>';
          for (j=0;j<jobs.length;j++){
            var job=jobs[j]; if (job.wc!==wc.id) continue;
            var checked = state.skills[worker.id][job.id] ? ' checked' : '';
            html += '<td class="cell-center"><input type="checkbox" class="chk" data-skill data-wid="'+worker.id+'" data-jid="'+job.id+'"'+checked+'></td>';
          }
          html += '</tr>';
        }
        html += '</tbody></table></div>';
      }
      return html;
    }

    function renderAvailability(){
      var html = '<div class="table-wrap"><table><thead><tr><th>Worker</th><th>Availability</th></tr></thead><tbody>';
      for (var i=0;i<state.workers.length;i++){
        var w = state.workers[i];
        html += '<tr><td>'+w.name+'</td><td><select data-avail data-wid="'+w.id+'">';
        for (var a=0;a<availabilityOptions.length;a++){
          var opt=availabilityOptions[a]; html += '<option'+(w.availability===opt?' selected':'')+'>'+opt+'</option>';
        }
        html += '</select></td></tr>';
      }
      html += '</tbody></table></div>';
      return html;
    }

    function renderDemand(){
      var html=''; for (var i=0;i<workcenters.length;i++){
        var wc=workcenters[i]; html += '<div class="group">'+wc.name+'</div>';
        for (var j=0;j<jobs.length;j++){
          var job=jobs[j]; if (job.wc!==wc.id) continue;
          var val = Number(state.demand[job.id]||0);
          html += ''
            + '<div class="slot">'
              + '<div><div class="title">'+job.title+'</div><div class="muted small">How many needed today?</div></div>'
              + '<div class="controls"><input type="number" min="0" step="1" value="'+val+'" data-demand data-jid="'+job.id+'"></div>'
            + '</div>';
        }
      }
      return html;
    }

    // Start
    render();
  });
})();
