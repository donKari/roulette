/**
 * SpinLux – Utils Module
 * Helper functions used across the app
 */

// ─── Color Utilities ────────────────────────────────────────────────────────

const PREMIUM_PALETTE = [
  "#C9A84C", "#8B5CF6", "#EC4899", "#10B981",
  "#F59E0B", "#3B82F6", "#EF4444", "#14B8A6",
  "#F97316", "#6366F1", "#84CC16", "#E11D48",
  "#0EA5E9", "#D946EF", "#22C55E", "#FB923C",
];

function getDefaultColor(index) {
  return PREMIUM_PALETTE[index % PREMIUM_PALETTE.length];
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getTextColor(bgHex) {
  return getLuminance(bgHex) > 0.55 ? "#1a1a2e" : "#ffffff";
}

function lightenColor(hex, amount = 0.2) {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

// ─── Random & Math ───────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pickWeightedIndex(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return weights.length - 1;
}

// ─── ID / String ────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function truncate(text, maxLen = 24) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ─── Easing ──────────────────────────────────────────────────────────────────

/** Custom easing: fast start, slow end with subtle bounce */
function easeOutBounce(t) {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Base64 / JSON ───────────────────────────────────────────────────────────

function encodeWheelToURL(wheelData) {
  try {
    const json = JSON.stringify(wheelData);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.searchParams.set("wheel", b64);
    return url.toString();
  } catch {
    return window.location.href;
  }
}

function decodeWheelFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("wheel");
    if (!b64) return null;
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function exportWheelJSON(wheelData) {
  const blob = new Blob([JSON.stringify(wheelData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spinlux-${wheelData.name || "wheel"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importWheelJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = {
  yesno: {
    name: "Yes / No",
    sections: [
      { text: "✅ OUI", color: "#10B981", weight: 1 },
      { text: "❌ NON", color: "#EF4444", weight: 1 },
    ],
  },
  "1to10": {
    name: "1 à 10",
    sections: Array.from({ length: 10 }, (_, i) => ({
      text: String(i + 1),
      color: PREMIUM_PALETTE[i % PREMIUM_PALETTE.length],
      weight: 1,
    })),
  },
  colors: {
    name: "Couleurs",
    sections: [
      { text: "🔴 Rouge", color: "#EF4444", weight: 1 },
      { text: "🟠 Orange", color: "#F97316", weight: 1 },
      { text: "🟡 Jaune", color: "#F59E0B", weight: 1 },
      { text: "🟢 Vert", color: "#10B981", weight: 1 },
      { text: "🔵 Bleu", color: "#3B82F6", weight: 1 },
      { text: "🟣 Violet", color: "#8B5CF6", weight: 1 },
      { text: "🩷 Rose", color: "#EC4899", weight: 1 },
    ],
  },
  days: {
    name: "Jours",
    sections: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(
      (d, i) => ({ text: d, color: PREMIUM_PALETTE[i], weight: 1 })
    ),
  },
  months: {
    name: "Mois",
    sections: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"].map(
      (m, i) => ({ text: m, color: PREMIUM_PALETTE[i % PREMIUM_PALETTE.length], weight: 1 })
    ),
  },
};

// ─── Toast Notification ──────────────────────────────────────────────────────

function showToast(message, type = "success", duration = 2500) {
  const existing = document.getElementById("sl-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "sl-toast";
  toast.className = `sl-toast sl-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("sl-toast--visible");
  });

  setTimeout(() => {
    toast.classList.remove("sl-toast--visible");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ─── Drag-to-Reorder ────────────────────────────────────────────────────────

function makeSortable(container, onReorder) {
  let dragSrc = null;

  container.addEventListener("dragstart", (e) => {
    const item = e.target.closest("[draggable]");
    if (!item) return;
    dragSrc = item;
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const item = e.target.closest("[draggable]");
    if (!item || item === dragSrc) return;
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    item.parentNode.insertBefore(dragSrc, e.clientY < midY ? item : item.nextSibling);
  });

  container.addEventListener("dragend", () => {
    if (dragSrc) {
      dragSrc.classList.remove("dragging");
      dragSrc = null;
    }
    onReorder?.();
  });
}

export {
  getDefaultColor,
  getTextColor,
  lightenColor,
  randomBetween,
  pickWeightedIndex,
  generateId,
  truncate,
  easeOutBounce,
  easeOutQuart,
  easeInOutCubic,
  encodeWheelToURL,
  decodeWheelFromURL,
  exportWheelJSON,
  importWheelJSON,
  TEMPLATES,
  PREMIUM_PALETTE,
  showToast,
  makeSortable,
};
