/**
 * SpinLux – Main App Controller
 * Orchestrates all modules: UI, wheel, storage, sound, i18n
 */

import { WheelEngine, drawPin } from "./wheel.js";
import { t, setLang, currentLang, applyTranslations, updateLangUI } from "./i18n.js";
import {
  generateId,
  getDefaultColor,
  encodeWheelToURL,
  decodeWheelFromURL,
  exportWheelJSON,
  importWheelJSON,
  TEMPLATES,
  showToast,
  makeSortable,
  truncate,
} from "./utils.js";

// ── State ─────────────────────────────────────────────────────────────────

let state = {
  wheels: [],          // all saved wheels
  activeWheelId: null, // currently selected wheel
  history: [],         // last 10 results [{text, color, ts}]
  soundEnabled: true,
  showWeights: false,
};

// ── Audio ─────────────────────────────────────────────────────────────────

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTick() {
  if (!state.soundEnabled) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

function playWin() {
  if (!state.soundEnabled) return;
  try {
    const ctx  = getAudioCtx();
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
      osc.start(t0);
      osc.stop(t0 + 0.4);
    });
  } catch {}
}

// Simulate ticking during spin
let tickInterval = null;
function startTicking() {
  if (tickInterval) return;
  let delay = 80;
  function scheduleTick() {
    tickInterval = setTimeout(() => {
      playTick();
      delay = Math.min(delay * 1.045, 450);
      if (delay < 500) scheduleTick();
      else {
        clearTimeout(tickInterval);
        tickInterval = null;
      }
    }, delay);
  }
  scheduleTick();
}

// ── Storage ───────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem("spinlux_state");
    if (raw) {
      const saved = JSON.parse(raw);
      state.wheels        = saved.wheels        || [];
      state.activeWheelId = saved.activeWheelId || null;
      state.history       = saved.history       || [];
      state.soundEnabled  = saved.soundEnabled  !== false;
    }
  } catch {}
}

function saveState() {
  try {
    localStorage.setItem("spinlux_state", JSON.stringify({
      wheels:        state.wheels,
      activeWheelId: state.activeWheelId,
      history:       state.history,
      soundEnabled:  state.soundEnabled,
    }));
  } catch {}
}

function getActiveWheel() {
  return state.wheels.find((w) => w.id === state.activeWheelId) || null;
}

function createNewWheel(name, sections) {
  const wheel = {
    id:       generateId(),
    name:     name || t("untitled"),
    sections: sections || [
      { id: generateId(), text: "Section 1", color: getDefaultColor(0), weight: 1 },
      { id: generateId(), text: "Section 2", color: getDefaultColor(1), weight: 1 },
      { id: generateId(), text: "Section 3", color: getDefaultColor(2), weight: 1 },
      { id: generateId(), text: "Section 4", color: getDefaultColor(3), weight: 1 },
    ],
  };
  state.wheels.push(wheel);
  state.activeWheelId = wheel.id;
  saveState();
  return wheel;
}

// ── DOM Refs ──────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

let wheelEngine = null;

// ── Render Loops ──────────────────────────────────────────────────────────

function renderSectionsList() {
  const wheel    = getActiveWheel();
  const list     = $("#sections-list");
  if (!list || !wheel) return;
  list.innerHTML = "";

  wheel.sections.forEach((sec, idx) => {
    const item = document.createElement("div");
    item.className = "section-item";
    item.setAttribute("draggable", "true");
    item.dataset.id = sec.id;
    item.innerHTML = `
      <span class="drag-handle" title="${t("drag_hint")}">⠿</span>
      <input type="color" class="sec-color" value="${sec.color}" title="${t("color")}">
      <input type="text" class="sec-text" value="${sec.text}" placeholder="${t("sectionText")}" maxlength="40">
      ${state.showWeights ? `<input type="number" class="sec-weight" value="${sec.weight || 1}" min="1" max="100" title="${t("weightLabel")}">` : ""}
      <button class="sec-delete btn-icon" data-idx="${idx}" title="${t("deleteSection")}">✕</button>
    `;
    list.appendChild(item);

    item.querySelector(".sec-color").addEventListener("input", (e) => {
      sec.color = e.target.value;
      syncWheel();
    });
    item.querySelector(".sec-text").addEventListener("input", (e) => {
      sec.text = e.target.value;
      syncWheel();
    });
    if (state.showWeights) {
      item.querySelector(".sec-weight").addEventListener("input", (e) => {
        sec.weight = Math.max(1, parseInt(e.target.value) || 1);
        syncWheel();
      });
    }
    item.querySelector(".sec-delete").addEventListener("click", () => {
      if (wheel.sections.length <= 2) return showToast(t("noSections"), "error");
      wheel.sections.splice(idx, 1);
      saveState();
      renderSectionsList();
      syncWheel();
    });
  });

  makeSortable(list, () => {
    const ids = $$(".section-item").map((el) => el.dataset.id);
    wheel.sections = ids.map((id) => wheel.sections.find((s) => s.id === id)).filter(Boolean);
    saveState();
    syncWheel();
  });
}

function renderWheelsList() {
  const container = $("#wheels-list");
  if (!container) return;
  container.innerHTML = "";

  state.wheels.forEach((wheel) => {
    const item = document.createElement("div");
    item.className = "wheel-item" + (wheel.id === state.activeWheelId ? " active" : "");
    item.innerHTML = `
      <span class="wheel-item__name">${truncate(wheel.name, 20)}</span>
      <span class="wheel-item__count">${wheel.sections.length} ${t("sections_count")}</span>
      <button class="btn-icon wheel-item__delete" data-id="${wheel.id}">✕</button>
    `;
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("wheel-item__delete")) return;
      state.activeWheelId = wheel.id;
      saveState();
      renderAll();
    });
    item.querySelector(".wheel-item__delete").addEventListener("click", () => {
      if (state.wheels.length <= 1) return showToast("Impossible de supprimer la dernière roue", "error");
      if (!confirm(t("confirmDelete"))) return;
      state.wheels = state.wheels.filter((w) => w.id !== wheel.id);
      if (state.activeWheelId === wheel.id) {
        state.activeWheelId = state.wheels[0]?.id || null;
      }
      saveState();
      renderAll();
    });
    container.appendChild(item);
  });
}

function renderHistory() {
  const container = $("#history-list");
  if (!container) return;

  if (state.history.length === 0) {
    container.innerHTML = `<p class="history-empty" data-i18n="historyEmpty">${t("historyEmpty")}</p>`;
    return;
  }

  container.innerHTML = state.history.map((item, i) => `
    <div class="history-item" style="--accent:${item.color}">
      <span class="history-dot"></span>
      <span class="history-text">${truncate(item.text, 28)}</span>
      <span class="history-time">${formatTime(item.ts)}</span>
    </div>
  `).join("");
}

function renderWheelName() {
  const wheel = getActiveWheel();
  const input = $("#wheel-name");
  if (input && wheel) input.value = wheel.name;
}

function renderAll() {
  renderWheelsList();
  renderSectionsList();
  renderHistory();
  renderWheelName();
  syncWheel();
  updateLangUI();
}

function syncWheel() {
  const wheel = getActiveWheel();
  if (wheelEngine && wheel) {
    wheelEngine.setSections(wheel.sections);
  }
}

// ── Confetti ──────────────────────────────────────────────────────────────

function launchConfetti(color) {
  const canvas  = document.getElementById("confetti-canvas");
  if (!canvas) return;
  canvas.style.display = "block";
  const ctx     = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 120 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * canvas.height * 0.4 - canvas.height * 0.2,
    vx:   (Math.random() - 0.5) * 8,
    vy:   Math.random() * 6 + 2,
    rot:  Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 0.3,
    w:    Math.random() * 10 + 5,
    h:    Math.random() * 5 + 3,
    color: [color, "#C9A84C", "#ffffff", "#8B5CF6", "#EC4899"][Math.floor(Math.random() * 5)],
    alpha: 1,
  }));

  let frame;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach((p) => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.rot  += p.vRot;
      p.vy   += 0.12;
      p.alpha = Math.max(0, p.alpha - 0.008);
      if (p.alpha > 0) alive = true;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) {
      frame = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
    }
  }
  frame = requestAnimationFrame(loop);
}

// ── Result Modal ──────────────────────────────────────────────────────────

function showResult(section) {
  const modal   = $("#result-modal");
  const text    = $("#result-text");
  const label   = $("#result-label");
  if (!modal) return;

  label.textContent = t("winner");
  text.textContent  = section.text;
  text.style.color  = section.color;
  modal.classList.add("open");

  playWin();
  launchConfetti(section.color);

  // History
  state.history.unshift({ text: section.text, color: section.color, ts: Date.now() });
  state.history = state.history.slice(0, 10);
  saveState();
  renderHistory();
}

function closeResultModal() {
  $("#result-modal")?.classList.remove("open");
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Section Controls ──────────────────────────────────────────────────────

function addSection() {
  const wheel = getActiveWheel();
  if (!wheel) return;
  if (wheel.sections.length >= 50) return showToast("Maximum 50 sections", "error");
  const idx = wheel.sections.length;
  wheel.sections.push({
    id:     generateId(),
    text:   `Section ${idx + 1}`,
    color:  getDefaultColor(idx),
    weight: 1,
  });
  saveState();
  renderSectionsList();
  syncWheel();
}

function applyTemplate(key) {
  const tpl   = TEMPLATES[key];
  if (!tpl) return;
  const wheel = getActiveWheel();
  if (!wheel) return;
  wheel.name     = tpl.name;
  wheel.sections = tpl.sections.map((s) => ({ ...s, id: generateId() }));
  saveState();
  renderAll();
  showToast("Template appliqué !");
}

// ── Share / Import / Export ───────────────────────────────────────────────

function shareWheel() {
  const wheel = getActiveWheel();
  if (!wheel) return;
  const url = encodeWheelToURL(wheel);
  navigator.clipboard.writeText(url).then(() => showToast(t("linkCopied")));
}

function handleExport() {
  const wheel = getActiveWheel();
  if (wheel) exportWheelJSON(wheel);
}

function handleImport() {
  const input = document.createElement("input");
  input.type  = "file";
  input.accept = ".json,application/json";
  input.onchange = async (e) => {
    try {
      const data = await importWheelJSON(e.target.files[0]);
      data.id = generateId(); // fresh ID
      state.wheels.push(data);
      state.activeWheelId = data.id;
      saveState();
      renderAll();
      showToast("Roue importée !");
    } catch {
      showToast("Fichier invalide", "error");
    }
  };
  input.click();
}

// ── Fullscreen ────────────────────────────────────────────────────────────

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

function init() {
  loadState();

  // Check URL for shared wheel
  const sharedWheel = decodeWheelFromURL();
  if (sharedWheel) {
    sharedWheel.id = generateId();
    const existing = state.wheels.find((w) => w.name === sharedWheel.name);
    if (!existing) {
      state.wheels.push(sharedWheel);
    }
    state.activeWheelId = sharedWheel.id;
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  // Ensure at least one wheel
  if (!state.wheels.length) {
    createNewWheel(t("untitled"));
  } else if (!state.activeWheelId || !getActiveWheel()) {
    state.activeWheelId = state.wheels[0].id;
  }

  // Apply lang
  applyTranslations();
  updateLangUI();

  // Init wheel engine
  const canvas = document.getElementById("wheel-canvas");
  if (canvas) {
    wheelEngine = new WheelEngine(canvas, {
      onStart: () => {
        startTicking();
        $("#spin-btn")?.classList.add("spinning");
        $("#spin-btn").textContent = t("spinning");
      },
      onResult: (idx, section) => {
        $("#spin-btn")?.classList.remove("spinning");
        $("#spin-btn").setAttribute("data-i18n", "spinBtn");
        $("#spin-btn").textContent = t("spinBtn");
        showResult(section);
      },
    });

    wheelEngine.requestSpin = () => {
      if (wheelEngine.spinning) return;
      const wheel = getActiveWheel();
      if (!wheel || wheel.sections.length < 2) {
        return showToast(t("noSections"), "error");
      }
      wheelEngine.spinRandom();
    };
  }

  // Init pin
  const pinCanvas = document.getElementById("pin-canvas");
  if (pinCanvas) drawPin(pinCanvas);

  renderAll();
  bindEvents();
}

function bindEvents() {
  // Language buttons
  $$(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  // Spin button
  $("#spin-btn")?.addEventListener("click", () => {
    if (wheelEngine?.spinning) return;
    const wheel = getActiveWheel();
    if (!wheel || wheel.sections.length < 2) return showToast(t("noSections"), "error");
    wheelEngine.spinRandom();
  });

  // Wheel name
  $("#wheel-name")?.addEventListener("input", (e) => {
    const wheel = getActiveWheel();
    if (wheel) {
      wheel.name = e.target.value;
      saveState();
      renderWheelsList();
    }
  });

  // Add section
  $("#add-section-btn")?.addEventListener("click", addSection);

  // New wheel
  $("#new-wheel-btn")?.addEventListener("click", () => {
    createNewWheel();
    renderAll();
  });

  // Sound toggle
  $("#sound-btn")?.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    saveState();
    updateSoundBtn();
  });

  // Templates
  $$("[data-template]").forEach((btn) => {
    btn.addEventListener("click", () => applyTemplate(btn.dataset.template));
  });

  // Advanced weights toggle
  $("#weights-toggle")?.addEventListener("click", () => {
    state.showWeights = !state.showWeights;
    $("#weights-toggle").classList.toggle("active", state.showWeights);
    renderSectionsList();
  });

  // Share / Export / Import
  $("#share-btn")?.addEventListener("click", shareWheel);
  $("#export-btn")?.addEventListener("click", handleExport);
  $("#import-btn")?.addEventListener("click", handleImport);

  // Fullscreen
  $("#fullscreen-btn")?.addEventListener("click", toggleFullscreen);

  // Clear history
  $("#clear-history-btn")?.addEventListener("click", () => {
    state.history = [];
    saveState();
    renderHistory();
  });

  // Result modal
  $("#result-close")?.addEventListener("click", closeResultModal);
  $("#result-again")?.addEventListener("click", () => {
    closeResultModal();
    setTimeout(() => wheelEngine?.requestSpin(), 300);
  });
  $("#result-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeResultModal();
  });

  // Save button
  $("#save-btn")?.addEventListener("click", () => {
    saveState();
    showToast(t("saved"));
  });
}

function updateSoundBtn() {
  const btn = $("#sound-btn");
  if (!btn) return;
  const isOn = state.soundEnabled;
  btn.textContent = isOn ? "🔊" : "🔇";
  btn.title = isOn ? t("soundOn") : t("soundOff");
  btn.classList.toggle("active", isOn);
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  updateSoundBtn();
});
