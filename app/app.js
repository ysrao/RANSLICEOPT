"use strict";

/* ---------------------------------------------------------------------
 * Band capability table (abstraction — see spec §12.2 Radio/Resource
 * Abstraction). Bandwidths in MHz, subcarrier spacing in kHz.
 * ------------------------------------------------------------------- */
const BAND_PARAMS = {
  FR1:    { bandwidths: [10, 20, 30, 40, 50, 60, 80, 100],        scs: [15, 30, 60] },
  FR2:    { bandwidths: [50, 100, 200, 400],                      scs: [60, 120] },
  FR3:    { bandwidths: [100, 200, 400, 800],                     scs: [120, 240] },
  SUBTHZ: { bandwidths: [400, 800, 1600, 2000, 3200],             scs: [480, 960] },
};

// 3GPP-style CQI -> spectral efficiency (bits/s/Hz), indices 1-15
const CQI_EFFICIENCY = [0.15, 0.23, 0.38, 0.60, 0.88, 1.18, 1.48, 1.91, 2.41, 2.73, 3.32, 3.90, 4.52, 5.12, 5.55];

const MIOT_SLA_PROFILES = {
  "best-effort": { label: "Best effort — monitor only", threshold: null },
  "managed-95": { label: "Managed target — 95% eventual success", threshold: 95 },
  "managed-99": { label: "Managed target — 99% eventual success", threshold: 99 },
  "contract-999": { label: "Contractual target — 99.9%", threshold: 99.9 },
};

const optionField = (key, label, options) => ({ key, label, options });

const SLICE_META = {
  urllc: {
    label: "URLLC", cls: "urllc", color: "#e2452c", slaLabel: "Deadline (ms)", slaDefault: 1,
    extra: [
      { key: "maxActive", label: "Max active URLLC connections / cell", min: 0, step: 1 },
      { key: "packetSize", label: "Packet size (bytes)", min: 1, step: 1 },
    ],
  },
  embb: {
    label: "eMBB", cls: "embb", color: "#2f6fed", slaLabel: "Min throughput (Mbps)", slaDefault: 50,
    extra: [],
  },
  miot: {
    label: "mIoT/eMTC", cls: "miot", color: "#1a9d63", slaLabel: "Access SLA profile", slaDefault: 99,
    extra: [
      optionField("registeredDensity", "Registered density (devices/m²)", [
        [0.0001, "Sparse — 100/km²"], [0.001, "Moderate — 1,000/km²"],
        [0.01, "Dense — 10,000/km²"], [0.1, "Very dense — 100,000/km²"], [1, "IMT capability check — 1,000,000/km²"],
      ]),
      optionField("accessPct", "Registered devices seeking access", [
        [0.1, "Light — 0.1%"], [1, "Typical — 1%"], [5, "Busy — 5%"], [20, "Access burst — 20%"],
      ]),
      optionField("avgAttempts", "Average attempts / accessing UE", [
        [1, "No retry amplification — 1.0"], [1.5, "Low retries — 1.5"], [2, "Moderate retries — 2.0"], [3, "High retries — 3.0"], [5, "Severe access stress — 5.0"],
      ]),
      optionField("minPrbPerDevice", "Min PRBs / admitted device", [[1, "1 PRB"], [2, "2 PRBs"], [4, "4 PRBs"]]),
    ],
  },
};

function defaultState() {
  const sites = Array.from({ length: 10 }, (_, i) => ({
    id: `Site-${String(i + 1).padStart(2, "0")}`,
    x: (i % 5) * 350,
    y: Math.floor(i / 5) * 350,
    activeUes: 150,
  }));
  return {
    cell: {
      name: "Cluster-01",
      band: "FR3",
      bandwidth: 400,
      scs: 120,
      duplex: "TDD",
      tddRatio: 4,
      carriers: 2,
      mimo: 16,
      morphology: "dense-urban",
      radius: 200,
      sites,
      cqi: 10,
    },
    slices: {
      urllc: { load: 15, sla: 1,  min: 15, target: 20, max: 35, borrow: true,  reclaim: "high",
                maxActive: 20, packetSize: 32 },
      embb:  { load: 60, sla: 50, min: 40, target: 55, max: 80, borrow: true,  reclaim: "medium" },
      miot:  { load: 25, slaProfile: "managed-99", sla: 99, min: 5, target: 10, max: 20, borrow: true, reclaim: "low",
                registeredDensity: 0.001, accessPct: 1, avgAttempts: 1.5, minPrbPerDevice: 2 },
    },
  };
}

let state = loadState() || defaultState();

/* ---------------------------------------------------------------------
 * Element refs
 * ------------------------------------------------------------------- */
const el = (id) => document.getElementById(id);
const cellFields = ["cellName", "band", "bandwidth", "scs", "duplex", "tddRatio", "carriers", "mimo", "morphology", "radius", "cqi"];

function init() {
  migrateState();
  populateBandDependentSelects();
  bindCellFields();
  renderSites();
  renderSliceCards();
  applyStateToInputs();
  wireGlobalButtons();
  recompute();
}

/* ---------------------------------------------------------------------
 * Band / bandwidth / SCS wiring
 * ------------------------------------------------------------------- */
function populateBandDependentSelects() {
  const band = state.cell.band;
  const params = BAND_PARAMS[band];

  const bwSel = el("bandwidth");
  bwSel.innerHTML = params.bandwidths.map(b => `<option value="${b}">${b} MHz</option>`).join("");
  if (!params.bandwidths.includes(state.cell.bandwidth)) state.cell.bandwidth = params.bandwidths[0];
  bwSel.value = state.cell.bandwidth;

  const scsSel = el("scs");
  scsSel.innerHTML = params.scs.map(s => `<option value="${s}">${s} kHz</option>`).join("");
  if (!params.scs.includes(state.cell.scs)) state.cell.scs = params.scs[0];
  scsSel.value = state.cell.scs;
}

function bindCellFields() {
  el("band").addEventListener("change", (e) => {
    state.cell.band = e.target.value;
    populateBandDependentSelects();
    recompute();
  });
  el("bandwidth").addEventListener("change", (e) => { state.cell.bandwidth = Number(e.target.value); recompute(); });
  el("scs").addEventListener("change", (e) => { state.cell.scs = Number(e.target.value); recompute(); });
  el("cellName").addEventListener("input", (e) => { state.cell.name = e.target.value; });
  el("duplex").addEventListener("change", (e) => {
    state.cell.duplex = e.target.value;
    el("tddRatioField").style.display = state.cell.duplex === "TDD" ? "" : "none";
    recompute();
  });
  el("morphology").addEventListener("change", (e) => { state.cell.morphology = e.target.value; recompute(); });

  bindRange("tddRatio", "tddRatioOut", (v) => { state.cell.tddRatio = v; return `${v}:1`; });
  bindRange("carriers", "carriersOut", (v) => { state.cell.carriers = v; return v; });
  bindRange("mimo", "mimoOut", (v) => { state.cell.mimo = v; return `${v}x`; });
  bindRange("radius", "radiusOut", (v) => { state.cell.radius = v; return v; });
  bindRange("cqi", "cqiOut", (v) => { state.cell.cqi = v; return v; });
}

function migrateState() {
  const defaults = defaultState();
  if (!Array.isArray(state.cell.sites) || state.cell.sites.length !== 10) {
    const oldUes = Math.max(0, Number(state.cell.ues) || 150);
    state.cell.sites = defaults.cell.sites.map(site => ({ ...site, activeUes: oldUes }));
  }
  const m = state.slices.miot;
  m.slaProfile ||= m.sla >= 99.9 ? "contract-999" : m.sla >= 99 ? "managed-99" : m.sla >= 95 ? "managed-95" : "best-effort";
  m.registeredDensity ??= Math.max(0, Number(m.maxActive) || 50) / (Math.PI * state.cell.radius ** 2);
  m.accessPct ??= 1;
  m.avgAttempts ??= 1.5;
  delete state.cell.ues;
  delete m.maxActive;
}

function renderSites() {
  el("siteList").innerHTML = state.cell.sites.map((site, index) => `
    <div class="site-row">
      <strong>${site.id}</strong>
      <input type="number" step="1" value="${site.x}" data-site="${index}" data-field="x" aria-label="${site.id} X coordinate">
      <input type="number" step="1" value="${site.y}" data-site="${index}" data-field="y" aria-label="${site.id} Y coordinate">
      <input type="number" min="0" step="1" value="${site.activeUes}" data-site="${index}" data-field="activeUes" aria-label="${site.id} active UEs">
    </div>`).join("");
  el("siteList").querySelectorAll("input").forEach(input => input.addEventListener("input", () => {
    state.cell.sites[Number(input.dataset.site)][input.dataset.field] = Number(input.value);
    recompute();
  }));
}

function bindRange(inputId, outId, apply) {
  const input = el(inputId);
  input.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    el(outId).textContent = apply(v);
    recompute();
  });
}

/* ---------------------------------------------------------------------
 * Slice panel rendering
 * ------------------------------------------------------------------- */
function renderSliceCards() {
  const container = el("sliceList");
  container.innerHTML = "";

  Object.keys(SLICE_META).forEach((key) => {
    const meta = SLICE_META[key];
    const s = state.slices[key];

    const card = document.createElement("div");
    card.className = `slice-card ${meta.cls}`;
    card.innerHTML = `
      <div class="slice-head">
        <span class="slice-name">${meta.label}</span>
      </div>
      <div class="slice-fields">
        <label class="field">
          <span>Offered load (%)</span>
          <input type="number" min="0" max="100" data-k="load" value="${s.load}">
        </label>
        ${key === "miot" ? `
        <label class="field">
          <span>${meta.slaLabel}</span>
          <select data-k="slaProfile">${Object.entries(MIOT_SLA_PROFILES).map(([value, p]) =>
            `<option value="${value}" ${s.slaProfile === value ? "selected" : ""}>${p.label}</option>`).join("")}</select>
        </label>` : `
        <label class="field">
          <span>${meta.slaLabel}</span>
          <input type="number" step="0.1" data-k="sla" value="${s.sla}">
        </label>`}
        ${meta.extra.map(f => f.options ? `
        <label class="field">
          <span>${f.label}</span>
          <select data-k="${f.key}">${f.options.map(([value, label]) =>
            `<option value="${value}" ${Number(s[f.key]) === Number(value) ? "selected" : ""}>${label}</option>`).join("")}</select>
        </label>` : `
        <label class="field">
          <span>${f.label}</span>
          <input type="number" min="${f.min}" step="${f.step}" data-k="${f.key}" value="${s[f.key]}">
        </label>`).join("")}
        ${key === "miot" ? `<div class="miot-note">Best effort has no hard success threshold. Managed values are engineering targets; use the contractual profile only when supported by the carrier agreement.</div>` : ""}
      </div>

      <div class="range-row">
        <div class="rr-label"><span>Minimum guarantee</span><b><span data-out="min">${s.min}</span>%</b></div>
        <input type="range" min="0" max="100" data-k="min" value="${s.min}">
      </div>
      <div class="range-row">
        <div class="rr-label"><span>Target share</span><b><span data-out="target">${s.target}</span>%</b></div>
        <input type="range" min="0" max="100" data-k="target" value="${s.target}">
      </div>
      <div class="range-row">
        <div class="rr-label"><span>Maximum cap</span><b><span data-out="max">${s.max}</span>%</b></div>
        <input type="range" min="0" max="100" data-k="max" value="${s.max}">
      </div>

      <div class="slice-toggles">
        <label><input type="checkbox" data-k="borrow" ${s.borrow ? "checked" : ""}> Borrowable when idle</label>
        <label>Reclaim priority
          <select data-k="reclaim">
            <option value="high" ${s.reclaim === "high" ? "selected" : ""}>High</option>
            <option value="medium" ${s.reclaim === "medium" ? "selected" : ""}>Medium</option>
            <option value="low" ${s.reclaim === "low" ? "selected" : ""}>Low</option>
          </select>
        </label>
      </div>
      <div class="slice-warn" data-out="warn"></div>
    `;

    container.appendChild(card);

    card.querySelectorAll("[data-k]").forEach((input) => {
      const k = input.dataset.k;
      const evt = input.type === "checkbox" ? "change" : (input.tagName === "SELECT" ? "change" : "input");
      input.addEventListener(evt, () => {
        let v = input.type === "checkbox" ? input.checked : input.value;
        if (input.type === "range" || input.type === "number" || (input.tagName === "SELECT" && k !== "reclaim" && k !== "slaProfile")) v = Number(v);
        s[k] = v;

        if (k === "slaProfile") s.sla = MIOT_SLA_PROFILES[v].threshold;

        if (k === "min" || k === "target" || k === "max") {
          if (s.min > s.max) { if (k === "min") s.max = s.min; else s.min = s.max; }
          if (s.target < s.min) s.target = s.min;
          if (s.target > s.max) s.target = s.max;
          card.querySelector('[data-k="min"]').value = s.min;
          card.querySelector('[data-k="target"]').value = s.target;
          card.querySelector('[data-k="max"]').value = s.max;
          card.querySelector('[data-out="min"]').textContent = s.min;
          card.querySelector('[data-out="target"]').textContent = s.target;
          card.querySelector('[data-out="max"]').textContent = s.max;
        }
        recompute();
      });
    });
  });
}

/* ---------------------------------------------------------------------
 * Derived computation + validation
 * ------------------------------------------------------------------- */
function computePrbPool() {
  const { bandwidth, scs, carriers } = state.cell;
  const usableKHz = bandwidth * 1000 * 0.90; // ~10% guard-band abstraction
  const prbWidthKHz = scs * 12;
  const perCarrier = Math.floor(usableKHz / prbWidthKHz);
  const perSite = perCarrier * carriers;
  return { perCarrier, perSite, total: perSite, clusterTotal: perSite * 10 };
}

/* Approximate the union of the ten coverage discs and assign every covered
 * sample to its nearest site. This makes site locations affect mIoT counts
 * without double-counting overlap between neighbouring cells. */
function computeSiteAreas() {
  const sites = state.cell.sites;
  const radius = Math.max(1, Number(state.cell.radius) || 1);
  const xs = sites.map(s => Number(s.x) || 0);
  const ys = sites.map(s => Number(s.y) || 0);
  const minX = Math.min(...xs) - radius, maxX = Math.max(...xs) + radius;
  const minY = Math.min(...ys) - radius, maxY = Math.max(...ys) + radius;
  const nx = 140, ny = 100;
  const dx = (maxX - minX) / nx, dy = (maxY - minY) / ny;
  const sampleArea = dx * dy;
  const areas = Array(10).fill(0);
  const r2 = radius * radius;
  for (let iy = 0; iy < ny; iy++) {
    const y = minY + (iy + 0.5) * dy;
    for (let ix = 0; ix < nx; ix++) {
      const x = minX + (ix + 0.5) * dx;
      let owner = -1, nearest = Infinity;
      for (let i = 0; i < sites.length; i++) {
        const d2 = (x - xs[i]) ** 2 + (y - ys[i]) ** 2;
        if (d2 <= r2 && d2 < nearest) { nearest = d2; owner = i; }
      }
      if (owner >= 0) areas[owner] += sampleArea;
    }
  }
  return areas;
}

function computeMiotDemand() {
  const m = state.slices.miot;
  const areas = computeSiteAreas();
  const bySite = areas.map((areaM2, index) => {
    const registered = areaM2 * Math.max(0, Number(m.registeredDensity) || 0);
    const seekingAccess = registered * Math.max(0, Number(m.accessPct) || 0) / 100;
    const attempts = seekingAccess * Math.max(1, Number(m.avgAttempts) || 1);
    return { siteId: state.cell.sites[index].id, areaM2, registered, seekingAccess, attempts };
  });
  return {
    bySite,
    coveredAreaM2: areas.reduce((a, b) => a + b, 0),
    registered: bySite.reduce((a, d) => a + d.registered, 0),
    seekingAccess: bySite.reduce((a, d) => a + d.seekingAccess, 0),
    attempts: bySite.reduce((a, d) => a + d.attempts, 0),
  };
}

function computeSpectralEfficiencyRaw() {
  const base = CQI_EFFICIENCY[state.cell.cqi - 1];
  const mimoGain = Math.sqrt(state.cell.mimo); // diminishing-returns abstraction
  return base * mimoGain;
}

function computeSpectralEfficiency() {
  return computeSpectralEfficiencyRaw().toFixed(2);
}

/* ---------------------------------------------------------------------
 * Capacity guard — hard PRB floors for URLLC and RedCap/mIoT.
 *
 * URLLC: worst-case simultaneous arrival of `maxActive` connections must
 * each clear a `packetSize`-byte grant within the configured deadline.
 * TTI duration follows the NR slot-scaling identity TTI_ms = 15 / SCS_kHz,
 * so bits/PRB/TTI reduces to spectralEfficiency * 180 regardless of SCS —
 * kept as an explicit formula below rather than the constant, since band/
 * SCS selection still changes how many TTIs fit inside the deadline.
 *
 * RedCap/mIoT: each active reduced-capability device needs a minimum
 * per-TTI grant to stay connected; the floor is the concurrent count
 * times that minimum.
 * ------------------------------------------------------------------- */
function computeHardFloors(pool) {
  const { scs } = state.cell;
  const ttiMs = 15 / scs;
  const specEff = computeSpectralEfficiencyRaw();
  const prbBandwidthHz = scs * 1000 * 12;
  const bitsPerPrbPerTti = specEff * prbBandwidthHz * (ttiMs / 1000);

  const u = state.slices.urllc;
  const prbsPerConn = Math.max(1, Math.ceil((u.packetSize * 8) / bitsPerPrbPerTti));
  const ttisInDeadline = Math.max(1, Math.floor(u.sla / ttiMs));
  const urllcRequiredPrbs = Math.ceil((u.maxActive * prbsPerConn) / ttisInDeadline);

  const m = state.slices.miot;
  const miotDemand = computeMiotDemand();
  const worstSiteAttempts = Math.max(...miotDemand.bySite.map(d => d.attempts), 0);
  const miotRequiredPrbs = Math.ceil(worstSiteAttempts * m.minPrbPerDevice);

  const pct = (prbs) => (pool.total > 0 ? (prbs / pool.total) * 100 : 0);
  const configuredPrbs = (pctVal) => Math.round((pctVal / 100) * pool.total);
  const configuredMiotPrbs = configuredPrbs(m.min);
  const estimatedAccessSuccessPct = miotRequiredPrbs === 0 ? 100 : Math.min(100, (configuredMiotPrbs / miotRequiredPrbs) * 100);

  return {
    ttiMs, prbsPerConn, ttisInDeadline,
    urllc: { requiredPrbs: urllcRequiredPrbs, floorPct: pct(urllcRequiredPrbs), configuredPrbs: configuredPrbs(u.min) },
    miot:  { requiredPrbs: miotRequiredPrbs, worstSiteAttempts, demand: miotDemand, estimatedAccessSuccessPct, floorPct: pct(miotRequiredPrbs), configuredPrbs: configuredMiotPrbs },
  };
}

function applyStateToInputs() {
  el("cellName").value = state.cell.name;
  el("band").value = state.cell.band;
  el("duplex").value = state.cell.duplex;
  el("tddRatioField").style.display = state.cell.duplex === "TDD" ? "" : "none";
  el("tddRatio").value = state.cell.tddRatio;
  el("tddRatioOut").textContent = `${state.cell.tddRatio}:1`;
  el("carriers").value = state.cell.carriers;
  el("carriersOut").textContent = state.cell.carriers;
  el("mimo").value = state.cell.mimo;
  el("mimoOut").textContent = `${state.cell.mimo}x`;
  el("morphology").value = state.cell.morphology;
  el("radius").value = state.cell.radius;
  el("radiusOut").textContent = state.cell.radius;
  el("cqi").value = state.cell.cqi;
  el("cqiOut").textContent = state.cell.cqi;
}

function recompute() {
  const pool = computePrbPool();
  el("prbPerCarrier").textContent = pool.perCarrier.toLocaleString();
  el("prbTotal").textContent = pool.total.toLocaleString();
  const miot = computeMiotDemand();
  el("clusterUes").textContent = state.cell.sites.reduce((sum, s) => sum + Math.max(0, Number(s.activeUes) || 0), 0).toLocaleString();
  el("coveredArea").textContent = `${Math.round(miot.coveredAreaM2).toLocaleString()} m²`;
  el("miotAttempts").textContent = Math.ceil(miot.attempts).toLocaleString();
  el("specEff").textContent = `${computeSpectralEfficiency()} b/s/Hz`;

  renderShareChart(pool);
  renderCapacityGuard(pool);
  renderAllocTable(pool);
  renderValidation(pool);
  renderPerSliceWarnings();
}

function renderCapacityGuard(pool) {
  const floors = computeHardFloors(pool);

  const rows = [
    {
      key: "urllc", label: "URLLC", f: floors.urllc, configuredPct: state.slices.urllc.min,
      detail: `${state.slices.urllc.maxActive} active conn. × ${floors.prbsPerConn} PRB/conn, `
            + `${floors.ttisInDeadline} TTI(s) available within ${state.slices.urllc.sla} ms deadline `
            + `(TTI = ${floors.ttiMs.toFixed(3)} ms at ${state.cell.scs} kHz SCS).`,
    },
    {
      key: "miot", label: "RedCap / mIoT", f: floors.miot, configuredPct: state.slices.miot.min,
      detail: `Estimated access success from available minimum capacity: ${floors.miot.estimatedAccessSuccessPct.toFixed(1)}%. Worst site: ${Math.ceil(floors.miot.worstSiteAttempts).toLocaleString()} effective access attempt(s), including retries, × ${state.slices.miot.minPrbPerDevice} min PRB/admitted device. Cluster: ${Math.ceil(floors.miot.demand.registered).toLocaleString()} registered, ${Math.ceil(floors.miot.demand.seekingAccess).toLocaleString()} unique devices seeking access, ${Math.ceil(floors.miot.demand.attempts).toLocaleString()} attempts.`,
    },
  ];

  el("capacityGuard").innerHTML = rows.map((r) => {
    const pass = r.f.requiredPrbs <= r.f.configuredPrbs;
    const floorPctCeil = Math.min(100, Math.ceil(r.f.floorPct));
    return `
      <div class="guard-item ${pass ? "guard-ok" : "guard-err"}">
        <div class="guard-head">
          <span>${pass ? "✓" : "✕"} ${r.label} hard floor</span>
          <span class="guard-pct">${r.f.requiredPrbs.toLocaleString()} PRB required (${r.f.floorPct.toFixed(1)}%) vs ${r.f.configuredPrbs.toLocaleString()} PRB configured (${r.configuredPct}%)</span>
        </div>
        <div class="guard-detail">${r.detail}</div>
        ${pass ? "" : `<button class="btn btn-fix" data-apply-slice="${r.key}" data-floor-pct="${floorPctCeil}">Apply required minimum (${floorPctCeil}%)</button>`}
      </div>`;
  }).join("");
}

function renderShareChart(pool) {
  const chart = el("shareChart");
  const legend = el("shareLegend");
  chart.innerHTML = "";
  legend.innerHTML = "";

  let sumTarget = 0;
  Object.keys(SLICE_META).forEach((key) => {
    const meta = SLICE_META[key];
    const s = state.slices[key];
    sumTarget += s.target;
    const seg = document.createElement("div");
    seg.className = "bar-seg";
    seg.style.width = `${s.target}%`;
    seg.style.background = meta.color;
    seg.title = `${meta.label}: ${s.target}%`;
    chart.appendChild(seg);
  });

  const remainder = Math.max(0, 100 - sumTarget);
  if (remainder > 0) {
    const seg = document.createElement("div");
    seg.className = "bar-seg";
    seg.style.width = `${remainder}%`;
    seg.style.background = "#dde2e8";
    seg.title = `Unallocated: ${remainder}%`;
    chart.appendChild(seg);
  }

  Object.keys(SLICE_META).forEach((key) => {
    const meta = SLICE_META[key];
    legend.innerHTML += `<span><span class="swatch" style="background:${meta.color}"></span>${meta.label} (${state.slices[key].target}%)</span>`;
  });
  if (remainder > 0) legend.innerHTML += `<span><span class="swatch" style="background:#dde2e8"></span>Unallocated (${remainder}%)</span>`;
}

function renderAllocTable(pool) {
  const tbody = document.querySelector("#allocTable tbody");
  tbody.innerHTML = "";
  Object.keys(SLICE_META).forEach((key) => {
    const meta = SLICE_META[key];
    const s = state.slices[key];
    const prbsAtTarget = Math.round((s.target / 100) * pool.total);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${meta.label}</td><td>${s.min}%</td><td>${s.target}%</td><td>${s.max}%</td><td>${prbsAtTarget.toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

function renderValidation(pool) {
  const list = el("validationList");
  list.innerHTML = "";
  const sumMin = Object.values(state.slices).reduce((a, s) => a + s.min, 0);
  const sumTarget = Object.values(state.slices).reduce((a, s) => a + s.target, 0);

  const items = [];

  items.push(sumMin <= 100
    ? { level: "ok", text: `Sum of minimum guarantees is ${sumMin}% (≤ 100%).` }
    : { level: "err", text: `Sum of minimum guarantees is ${sumMin}% — exceeds 100% of PRB pool. Capacity conservation violated.` });

  items.push(sumTarget <= 100
    ? { level: "ok", text: `Sum of target shares is ${sumTarget}% (≤ 100%).` }
    : { level: "warn", text: `Sum of target shares is ${sumTarget}% — not all slices can operate at target simultaneously without borrowing.` });

  Object.keys(SLICE_META).forEach((key) => {
    const meta = SLICE_META[key];
    const s = state.slices[key];
    if (!(s.min <= s.target && s.target <= s.max)) {
      items.push({ level: "err", text: `${meta.label}: target must satisfy min ≤ target ≤ max.` });
    }
  });

  items.push(pool.total > 0
    ? { level: "ok", text: `${pool.total.toLocaleString()} PRBs per site; ${pool.clusterTotal.toLocaleString()} PRBs across the 10-site cluster.` }
    : { level: "err", text: "Computed PRB pool is zero for this bandwidth/numerology combination." });

  const coordinateKeys = state.cell.sites.map(s => `${Number(s.x)},${Number(s.y)}`);
  items.push(new Set(coordinateKeys).size === 10
    ? { level: "ok", text: "All 10 site locations are unique." }
    : { level: "err", text: "Two or more sites share the same X/Y location." });

  const m = state.slices.miot;
  items.push(m.registeredDensity <= 1
    ? { level: "ok", text: `Registered mIoT density is ${m.registeredDensity} devices/m² (≤ the IMT-2020 capability reference of 1 device/m²).` }
    : { level: "warn", text: `Registered mIoT density is ${m.registeredDensity} devices/m², above the 1 device/m² IMT-2020 capability reference.` });
  const profile = MIOT_SLA_PROFILES[m.slaProfile];
  const estimatedSuccess = computeHardFloors(pool).miot.estimatedAccessSuccessPct;
  items.push(profile.threshold === null
    ? { level: "warn", text: `mIoT is Best effort: estimated access success is ${estimatedSuccess.toFixed(1)}%, but there is no hard SLA threshold.` }
    : estimatedSuccess >= profile.threshold
      ? { level: "ok", text: `Estimated mIoT access success ${estimatedSuccess.toFixed(1)}% meets the ${profile.threshold}% engineering/contract target.` }
      : { level: "err", text: `Estimated mIoT access success ${estimatedSuccess.toFixed(1)}% is below the ${profile.threshold}% engineering/contract target.` });

  list.innerHTML = items.map(i => `<li class="v-${i.level}">${iconFor(i.level)} ${i.text}</li>`).join("");
}

function renderPerSliceWarnings() {
  document.querySelectorAll(".slice-card").forEach((card, idx) => {
    const key = Object.keys(SLICE_META)[idx];
    const s = state.slices[key];
    const warnEl = card.querySelector('[data-out="warn"]');
    if (!(s.min <= s.target && s.target <= s.max)) {
      warnEl.textContent = "Constraint violated: min ≤ target ≤ max required.";
    } else {
      warnEl.textContent = "";
    }
  });
}

function iconFor(level) {
  return level === "ok" ? "✓" : level === "warn" ? "⚠" : "✕";
}

/* ---------------------------------------------------------------------
 * Persistence / export
 * ------------------------------------------------------------------- */
const STORAGE_KEY = "ransliceopt_config_v15_3";
const LEGACY_STORAGE_KEY = "ransliceopt_config_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function wireGlobalButtons() {
  el("capacityGuard").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-apply-slice]");
    if (!btn) return;
    const key = btn.dataset.applySlice;
    const pct = Math.min(100, Number(btn.dataset.floorPct));
    const s = state.slices[key];
    s.min = pct;
    if (s.target < s.min) s.target = s.min;
    if (s.max < s.min) s.max = s.min;
    renderSliceCards();
    recompute();
  });

  el("btn-save").addEventListener("click", () => {
    saveState();
    flashButton("btn-save", "Saved");
  });

  el("btn-reset").addEventListener("click", () => {
    if (!confirm("Reset configuration to defaults? This clears the saved local configuration.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    populateBandDependentSelects();
    applyStateToInputs();
    renderSites();
    renderSliceCards();
    recompute();
  });

  el("btn-export").addEventListener("click", () => {
    const payload = {
      configVersion: "15.3-multicell",
      generatedAt: new Date().toISOString(),
      cell: state.cell,
      derived: {
        prbPool: computePrbPool(),
        clusterActiveUes: state.cell.sites.reduce((sum, site) => sum + site.activeUes, 0),
        miotDemand: computeMiotDemand(),
        spectralEfficiency: computeSpectralEfficiency(),
      },
      slices: state.slices,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.cell.name || "ransliceopt-config"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function flashButton(id, text) {
  const btn = el(id);
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, 1200);
}

init();
