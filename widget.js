// widget.js
document.addEventListener("DOMContentLoaded", () => {
  // --- Build container ---
  const widget = document.createElement("section");
  widget.id = "wilya-chatbox";
  widget.setAttribute("role", "region");
  widget.setAttribute("aria-label", "Wilya Chatbox");

  const header = document.createElement("div");
  header.className = "w-header";
  header.textContent = "Wilya • Workforce Assistant";
  widget.appendChild(header);

  const chat = document.createElement("div");
  chat.className = "w-chat";
  chat.setAttribute("aria-live", "polite");
  widget.appendChild(chat);

  const inputWrap = document.createElement("div");
  inputWrap.className = "w-input";
  widget.appendChild(inputWrap);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your answer… (press Enter to send)";
  input.setAttribute("aria-label", "Message");
  inputWrap.appendChild(input);

  const send = document.createElement("button");
  send.className = "w-send";
  send.type = "button";
  send.textContent = "Send";
  inputWrap.appendChild(send);

  // --- Insert below intro (or top if no intro) ---
  const anchor = document.getElementById("hero-intro");
  if (anchor) anchor.insertAdjacentElement("afterend", widget);
  else document.body.insertBefore(widget, document.body.firstElementChild || null);

  // --- UI helpers ---
  function addMessage(text, sender = "system") {
    const msg = document.createElement("div");
    msg.className = `bubble ${sender}`;
    msg.textContent = text;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
  }

  function addCard(html) {
    const wrap = document.createElement("div");
    wrap.className = "result-card";
    wrap.innerHTML = html;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  // --- Formatting helpers ---
  const fmtUSD = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  // --- Flow definition ---
  const flow = [
    { key: "workers", prompt: "How many frontline workers at your largest site?", type: "int", min: 1, max: 100000 },
    { key: "hourlyRate", prompt: "Average hourly rate in USD?", type: "float", min: 10, max: 500 },
    { key: "currentUtilization", prompt: "Current labor utilization (%)?", type: "percent", min: 0, max: 100 },
    { key: "otHoursPerWorkerPerMonth", prompt: "Average OT hours per worker per month?", type: "float", min: 0, max: 100 },
    { key: "absenteeismRate", prompt: "Monthly absenteeism rate (%)?", type: "percent", min: 0, max: 100 },
    { key: "crossTrainingScore", prompt: "Cross-training level (0–5, where 5 = highly cross-trained)?", type: "scale5", min: 0, max: 5 },
  ];

  // --- State ---
  const answers = {};
  let step = 0;

  // --- Parsing & validation ---
  function parseValue(input, def) {
    const s = input.trim();
    switch (def.type) {
      case "int": {
        const v = parseInt(s.replace(/[^0-9\-]/g, ""), 10);
        if (Number.isNaN(v)) return { ok: false, msg: "Please enter a whole number." };
        return v < def.min || v > def.max
          ? { ok: false, msg: `Please enter a value between ${def.min} and ${def.max}.` }
          : { ok: true, value: v };
      }
      case "float": {
        const v = parseFloat(s.replace(/[^0-9.\-]/g, ""));
        if (Number.isNaN(v)) return { ok: false, msg: "Please enter a number." };
        return v < def.min || v > def.max
          ? { ok: false, msg: `Please enter a value between ${def.min} and ${def.max}.` }
          : { ok: true, value: v };
      }
      case "percent": {
        const m = s.match(/-?\d+(\.\d+)?/);
        if (!m) return { ok: false, msg: "Please enter a percentage (e.g., 75%)." };
        let v = parseFloat(m[0]);
        if (v < def.min || v > def.max) return { ok: false, msg: `Enter a % between ${def.min} and ${def.max}.` };
        return { ok: true, value: v / 100 };
      }
      case "scale5": {
        const v = parseFloat(s.replace(/[^0-9.\-]/g, ""));
        if (Number.isNaN(v)) return { ok: false, msg: "Enter a number from 0 to 5." };
        if (v < def.min || v > def.max) return { ok: false, msg: "Enter a number from 0 to 5." };
        return { ok: true, value: v / 5 }; // normalize 0–1
      }
      default:
        return { ok: false, msg: "Invalid input." };
    }
  }

  // --- Math (deterministic) ---
  function computeSavings(a) {
    // Inputs normalized
    const workers = a.workers;
    const rate = a.hourlyRate;
    const util = clamp(a.currentUtilization, 0, 1);
    const otHrs = Math.max(0, a.otHoursPerWorkerPerMonth || 0);
    const absent = clamp(a.absenteeismRate || 0, 0, 1);
    const cross = clamp(a.crossTrainingScore || 0, 0, 1);

    // Assumptions (tweakable)
    const utilLiftLow = cross >= 0.5 ? 0.03 : 0.01;
    const utilLiftHigh = cross >= 0.5 ? 0.08 : 0.04;
    const otRedLow = 0.15, otRedHigh = 0.35;
    const recovLow = 0.05, recovHigh = 0.15;
    const baseHours = workers * 160; // /month
    const softwareCostMonthly = 1500;

    // Components
    const utilValLow = baseHours * utilLiftLow * rate;
    const utilValHigh = baseHours * utilLiftHigh * rate;

    const otCost = workers * otHrs * rate;
    const otSavLow = otCost * otRedLow;
    const otSavHigh = otCost * otRedHigh;

    const absentCost = baseHours * absent * rate;
    const absentRecLow = absentCost * recovLow;
    const absentRecHigh = absentCost * recovHigh;

    const totalLow = utilValLow + otSavLow + absentRecLow;
    const totalHigh = utilValHigh + otSavHigh + absentRecHigh;

    return {
      totalLow, totalHigh,
      components: {
        utilization: [utilValLow, utilValHigh],
        overtime: [otSavLow, otSavHigh],
        absenteeism: [absentRecLow, absentRecHigh],
      },
      assumptions: {
        utilLift: [utilLiftLow, utilLiftHigh],
        otReduction: [otRedLow, otRedHigh],
        absenceRecovery: [recovLow, recovHigh],
        baseHours,
        softwareCostMonthly,
      },
      roiLow: totalLow / softwareCostMonthly,
      roiHigh: totalHigh / softwareCostMonthly,
    };
  }

  // --- Flow control ---
  function askNext() {
    if (step >= flow.length) {
      // Compute + show result
      const res = computeSavings(answers);
      const cardHTML = `
        <div class="result-title">Estimated Monthly Savings</div>
        <div class="stat-row">
          <div class="stat">
            <div class="stat-label">Range</div>
            <div class="stat-value">${fmtUSD(res.totalLow)} – ${fmtUSD(res.totalHigh)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">ROI</div>
            <div class="stat-value">${res.roiLow.toFixed(1)}× – ${res.roiHigh.toFixed(1)}×</div>
          </div>
        </div>
        <div class="kv">
          <div>Top levers</div>
          <ul>
            <li>Reduce OT spikes via skills-based assignment</li>
            <li>${answers.crossTrainingScore >= 0.5 ? "Leverage cross-training to lift utilization" : "Targeted cross-training to lift utilization"}</li>
            <li>Better absence backfill and coverage</li>
          </ul>
        </div>
        <details class="assumptions">
          <summary>Assumptions used</summary>
          <div>Utilization lift: ${(res.assumptions.utilLift[0]*100).toFixed(0)}–${(res.assumptions.utilLift[1]*100).toFixed(0)}%</div>
          <div>OT reduction: ${(res.assumptions.otReduction[0]*100).toFixed(0)}–${(res.assumptions.otReduction[1]*100).toFixed(0)}%</div>
          <div>Absence recovery: ${(res.assumptions.absenceRecovery[0]*100).toFixed(0)}–${(res.assumptions.absenceRecovery[1]*100).toFixed(0)}%</div>
          <div>Base hours: ${res.assumptions.baseHours.toLocaleString()} / month</div>
          <div>Software cost (assumed): ${fmtUSD(res.assumptions.softwareCostMonthly)}/mo</div>
        </details>
      `;
      addCard(cardHTML);
      addMessage("Would you like a PDF breakdown or to book a 15-minute walkthrough?", "system");
      return;
    }
    const q = flow[step];
    addMessage(q.prompt, "system");
  }

  function handleUserInput(raw) {
    const q = flow[step];
    const parsed = parseValue(raw, q);
    if (!parsed.ok) {
      addMessage(parsed.msg, "system");
      addMessage(q.prompt, "system");
      return;
    }
    answers[q.key] = parsed.value;
    step += 1;
    askNext();
  }

  // --- Start ---
  addMessage("👋 Welcome! I’ll ask a few quick questions to estimate potential monthly savings.");
  askNext();

  // --- Events ---
  function handleSend() {
    const val = input.value.trim();
    if (!val) return;
    addMessage(val, "user");
    input.value = "";
    handleUserInput(val);
  }

  send.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  });
});
