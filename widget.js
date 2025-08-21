// =====================
// Wilya Hero Widget for wilya.space
// =====================
(function () {
  const widgetRoot = document.getElementById("wilya-hero-widget");
  if (!widgetRoot) return;

  // ---- Worker & Job Setup ----
  const workers = [
    { name: "Alice", skills: ["CNC Operator"], status: "available" },
    { name: "Bob", skills: ["CNC Operator", "Packer"], status: "available" },
    { name: "Carol", skills: ["Forklift Driver"], status: "vacation" },
    { name: "Dave", skills: ["Material Handler"], status: "available" },
    { name: "Eve", skills: ["Packer"], status: "training" },
    { name: "Frank", skills: ["Forklift Driver", "Material Handler"], status: "available" },
    { name: "Grace", skills: ["CNC Operator"], status: "available" },
    { name: "Hank", skills: ["Material Handler"], status: "available" },
    { name: "Ivy", skills: ["Packer"], status: "available" },
    { name: "Jack", skills: ["Forklift Driver"], status: "available" }
  ];

  let demand = {
    "CNC Operator": 1,
    "Packer": 1,
    "Forklift Driver": 1,
    "Material Handler": 1
  };

  // ---- DOM helpers ----
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  // ---- Render Tabs ----
  function render() {
    widgetRoot.innerHTML = "";

    const tabs = ["Skills Matrix", "Worker Availability", "Demand", "Auto Assignment"];
    const tabNav = el("div", "tabs");
    const tabContent = el("div", "tab-content");

    tabs.forEach((tab, i) => {
      const btn = el("button", "tab-btn", tab);
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", () => {
        [...tabNav.children].forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        showTab(tab, tabContent);
      });
      tabNav.appendChild(btn);
    });

    widgetRoot.appendChild(tabNav);
    widgetRoot.appendChild(tabContent);
    showTab("Skills Matrix", tabContent);
  }

  // ---- Show Tab Content ----
  function showTab(tab, container) {
    container.innerHTML = "";
    if (tab === "Skills Matrix") renderSkills(container);
    if (tab === "Worker Availability") renderAvailability(container);
    if (tab === "Demand") renderDemand(container);
    if (tab === "Auto Assignment") renderAssignment(container);
  }

  // ---- Tab: Skills ----
  function renderSkills(container) {
    const table = el("table", "matrix");
    const header = el("tr");
    header.appendChild(el("th", "", "Worker"));
    Object.keys(demand).forEach(job => header.appendChild(el("th", "", job)));
    table.appendChild(header);

    workers.forEach(w => {
      const row = el("tr");
      row.appendChild(el("td", "", w.name));
      Object.keys(demand).forEach(job => {
        const cell = el("td");
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = w.skills.includes(job);
        chk.addEventListener("change", () => {
          if (chk.checked) {
            if (!w.skills.includes(job)) w.skills.push(job);
          } else {
            w.skills = w.skills.filter(s => s !== job);
          }
        });
        cell.appendChild(chk);
        row.appendChild(cell);
      });
      table.appendChild(row);
    });

    container.appendChild(table);
  }

  // ---- Tab: Availability ----
  function renderAvailability(container) {
    workers.forEach(w => {
      const row = el("div", "row");
      row.appendChild(el("span", "label", w.name));
      const select = document.createElement("select");
      ["available", "vacation", "training"].forEach(opt => {
        const o = el("option", "", opt);
        o.value = opt;
        if (opt === w.status) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener("change", () => (w.status = select.value));
      row.appendChild(select);
      container.appendChild(row);
    });
  }

  // ---- Tab: Demand ----
  function renderDemand(container) {
    Object.keys(demand).forEach(job => {
      const row = el("div", "row");
      row.appendChild(el("span", "label", job));
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.value = demand[job];
      input.addEventListener("input", () => (demand[job] = parseInt(input.value)));
      row.appendChild(input);
      container.appendChild(row);
    });
  }

  // ---- Tab: Auto Assignment ----
  function renderAssignment(container) {
    const assignBtn = el("button", "assign-btn", "Run Auto Assignment");
    container.appendChild(assignBtn);
    const results = el("div", "results");
    container.appendChild(results);

    assignBtn.addEventListener("click", () => {
      results.innerHTML = "";
      Object.keys(demand).forEach(job => {
        const jobBox = el("div", "job-box");
        const title = el("h4", "", `${job} (need ${demand[job]})`);
        jobBox.appendChild(title);
        results.appendChild(jobBox);

        const eligible = workers.filter(
          w => w.skills.includes(job) && w.status === "available"
        );
        const assigned = eligible.slice(0, demand[job]);

        assigned.forEach(w => {
          const chip = el("div", "worker-chip", w.name);

          // --- animation: fly into slot ---
          chip.classList.add("fly-in");
          chip.addEventListener("animationend", () => {
            chip.classList.remove("fly-in");
          });

          jobBox.appendChild(chip);
        });

        if (assigned.length < demand[job]) {
          const missing = demand[job] - assigned.length;
          const warn = el("div", "warn", `⚠ Missing ${missing}`);
          jobBox.appendChild(warn);
        }
      });
    });
  }

  render();
})();
