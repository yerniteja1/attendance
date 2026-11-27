    const MACHINES = [1, 2, 3, 4, 5];
    const MACHINE_TASKS = ["Mixing", "Cutting", "Hopping", "Cleaning", "Maintenance"];

    const GENERAL_ROLES = [
      "Operators",
      "Mixers",
      "Cutting",
      "Floor Cleaning",
      "Office Work",
      "Grinding Cleaning",
      "PVC",
      "WPC",
      "RUC",
      "RUC Sewing Bags",
      "Shifting",
      "Grinding",
      "Maintenance Work",
      "Others"
    ];

    const ROLE_GROUPS = [
      ...MACHINES.map(m => ({
        label: `Machine ${m}`,
        roles: MACHINE_TASKS.map(task => `M${m} ${task}`)
      })),
      { label: "General", roles: GENERAL_ROLES }
    ];

    const ROLES = ROLE_GROUPS.flatMap(group => group.roles);

    // Display labels (data values stay unchanged so existing workers keep working)
    const ROLE_LABELS = {
      Mixers: "Mixing (Unassigned)"
    };

    function roleLabel(role) {
      return ROLE_LABELS[role] || role;
    }

    function roleOptionsHtml(selectedRole) {
      return ROLE_GROUPS.map(group => `
        <optgroup label="${group.label}">
          ${group.roles.map(r => `<option value="${r}" ${r === selectedRole ? "selected" : ""}>${roleLabel(r)}</option>`).join("")}
        </optgroup>
      `).join("");
    }

    function renderNewRoleOptions() {
      document.getElementById("newRole").innerHTML = roleOptionsHtml("Mixers");
    }

    // Single source of truth: load workers from workers.json
    let workers = [];

    const MACHINE_STATES = ["off", "running", "willrun", "maintenance"];
    const MACHINE_STATE_LABELS = {
      off: "Off",
      running: "Running",
      willrun: "Will Run",
      maintenance: "Maintenance"
    };

    let machineStatus = {};
    try {
      machineStatus = JSON.parse(localStorage.getItem("hw_v6_machine_status") || "{}");
    } catch (e) {
      machineStatus = {};
    }

    // Fetch workers data from workers.json (the only data source)
    fetch('workers.json')
      .then(response => response.json())
      .then(data => {
        workers = data;
        render();
      })
      .catch(err => {
        console.error('Failed to load workers.json', err);
        // Fallback to empty state - no hardcoded defaults
        workers = [];
        render();
      });

    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    document.getElementById("shiftDate").value = localISO;

    let isDayShift = now.getHours() >= 8 && now.getHours() < 20;
    let activeFilter = localStorage.getItem("hw_v6_filter") || "ALL";

    function save() {
      localStorage.setItem("hw_v6_roster", JSON.stringify(workers));
      render();
    }

    function setFilter(f) {
      activeFilter = f;
      localStorage.setItem("hw_v6_filter", f);
      render();
    }

    function toggleWorkerShift(i) {
      workers[i][2] = workers[i][2] === "A" ? "B" : "A";
      save();
    }

    function toggleMachine(num) {
      const current = machineStatus[num] || "off";
      const next = MACHINE_STATES[(MACHINE_STATES.indexOf(current) + 1) % MACHINE_STATES.length];
      machineStatus[num] = next;
      localStorage.setItem("hw_v6_machine_status", JSON.stringify(machineStatus));
      renderMachines();
    }

    function renderMachines() {
      document.querySelectorAll(".m-btn").forEach(btn => {
        const num = Number(btn.dataset.m);
        const state = MACHINE_STATES.includes(machineStatus[num]) ? machineStatus[num] : "off";
        btn.classList.remove("m-running", "m-willrun", "m-maintenance");
        if (state !== "off") btn.classList.add(`m-${state}`);
        btn.title = `M${num}: ${MACHINE_STATE_LABELS[state]} (tap to change)`;
      });
    }

    function toggleDayNight() {
      isDayShift = !isDayShift;
      renderDayNightBtn();
    }

    function renderDayNightBtn() {
      document.getElementById("shiftToggle").textContent = isDayShift ? "☀️ Day" : "🌙 Night";
    }

    function setStatus(i, status) {
      workers[i][3] = status;
      save();
    }

    function setRole(i, role) {
      workers[i][1] = role;
      save();
    }

    function addWorker() {
      const input = document.getElementById("newName");
      const role = document.getElementById("newRole").value;
      const shift = document.getElementById("newShift").value;
      const name = input.value.trim();
      if (!name) return;
      workers.push([name, role, shift, "HW"]);
      input.value = "";
      save();
    }

    function removeWorker(i) {
      if (confirm(`Remove ${workers[i][0]}?`)) {
        workers.splice(i, 1);
        save();
      }
    }

    function getVisibleWorkers() {
      return workers
        .map((w, idx) => ({ name: w[0], role: w[1], shift: w[2], status: w[3], idx }))
        .filter(w => activeFilter === "ALL" || w.shift === activeFilter);
    }

    function nonOpCount(status) {
      return getVisibleWorkers().filter(w => w.status === status && w.role !== "Operators").length;
    }

    function render() {
      renderDayNightBtn();
      renderMachines();

      document.querySelectorAll(".f-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.f === activeFilter);
      });

      const summary = [
        nonOpCount("HW") > 0 ? `HW: ${nonOpCount("HW")}` : null,
        nonOpCount("HT") > 0 ? `HT: ${nonOpCount("HT")}` : null,
        nonOpCount("A") > 0 ? `Abs: ${nonOpCount("A")}` : null
      ].filter(Boolean).join(" | ") || "0 non-ops";

      document.getElementById("counts").textContent = summary;

      const visible = getVisibleWorkers();
      const list = document.getElementById("list");

      list.innerHTML = ROLES.map(role => {
        const items = visible.filter(w => w.role === role);
        if (!items.length) return "";

        return `
          <div class="group-title">${roleLabel(role)} (${items.length})</div>
          ${items.map(w => `
            <div class="card">
              <div class="card-top">
                <span class="name">${w.name}</span>
                <button class="badge-shift ${w.shift === 'A' ? 'shift-a' : 'shift-b'}" onclick="toggleWorkerShift(${w.idx})" title="Tap to switch A/B shift">Shift ${w.shift}</button>
                <select class="role-select" onchange="setRole(${w.idx}, this.value)">
                  ${roleOptionsHtml(w.role)}
                </select>
                <button class="del-btn" onclick="removeWorker(${w.idx})" title="Remove">×</button>
              </div>
              <div class="btns">
                <button class="st-btn ${w.status === 'HW' ? 'active-hw' : ''}" onclick="setStatus(${w.idx},'HW')">Hiwood</button>
                <button class="st-btn ${w.status === 'HT' ? 'active-ht' : ''}" onclick="setStatus(${w.idx},'HT')">HiTech</button>
                <button class="st-btn ${w.status === 'A' ? 'active-a' : ''}" onclick="setStatus(${w.idx},'A')">Absent</button>
              </div>
            </div>
          `).join("")}
        `;
      }).join("");
    }

    function getFormattedDate() {
      const val = document.getElementById("shiftDate").value;
      if (!val) return new Date().toLocaleDateString("en-GB");
      const [y, m, d] = val.split("-");
      return `${d}/${m}/${y}`;
    }

    function formatSectionBlock(list, useRoleHeaders) {
      let lines = [];
      let counter = 1;

      const ops = list.filter(w => w.role === "Operators");
      if (ops.length) {
        lines.push(`_Operators:_`);
        ops.forEach(w => lines.push(`• ${w.name}`));
      }

      const labourRoles = ROLES.filter(r => r !== "Operators");
      labourRoles.forEach(role => {
        const matched = list.filter(w => w.role === role);
        if (!matched.length) return;

        if (useRoleHeaders) {
          lines.push(`_${roleLabel(role)}:_`);
        }

        matched.forEach(w => lines.push(`${counter++}. ${w.name}`));
      });

      return lines.join("\n");
    }

    function buildSection(status, emoji, title, useRoleHeaders) {
      const list = getVisibleWorkers().filter(w => w.status === status);
      if (list.length <= 0) return null;

      const count = nonOpCount(status);
      const countTag = count > 0 ? ` (${count})` : "";
      return `${emoji} *${title}${countTag}:*\n${formatSectionBlock(list, useRoleHeaders)}`;
    }

    function buildMachineStatusBlock() {
      const groups = { running: [], willrun: [], maintenance: [], off: [] };
      [1, 2, 3, 4, 5].forEach(num => {
        const state = MACHINE_STATES.includes(machineStatus[num]) ? machineStatus[num] : "off";
        groups[state].push(`M${num}`);
      });

      const lines = [];
      if (groups.running.length) lines.push(`🟢 Running: ${groups.running.join(", ")}`);
      if (groups.willrun.length) lines.push(`🟡 Will run: ${groups.willrun.join(", ")}`);
      if (groups.maintenance.length) lines.push(`🔴 Maintenance: ${groups.maintenance.join(", ")}`);
      if (groups.off.length && lines.length) lines.push(`⚪ Off: ${groups.off.join(", ")}`);

      if (!lines.length) return null;
      return `⚙️ *Machine Status:*\n${lines.join("\n")}`;
    }

    function buildMessage() {
      const date = getFormattedDate();
      const shiftLabel = isDayShift ? "Day" : "Night";
      const subShiftTag = activeFilter === "ALL" ? "" : ` (Shift ${activeFilter})`;

      const blocks = [
        `*Production Manpower allocation ${date} - ${shiftLabel}${subShiftTag}*`,
        buildMachineStatusBlock(),
        buildSection("HW", "✅", "Hiwood", true),
        buildSection("HT", "🏭", "Sent to HiTech", false),
        buildSection("A", "❌", "Absent", false)
      ].filter(Boolean);

      return blocks.join("\n\n");
    }

    function sendWhatsApp() {
      window.open("https://wa.me/?text=" + encodeURIComponent(buildMessage()), "_blank");
    }

    function copyText() {
      navigator.clipboard.writeText(buildMessage()).then(() => alert("Copied to clipboard!"));
    }

    renderNewRoleOptions();
    render();
