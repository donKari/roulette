/**
 * SpinLux – i18n Module
 * Manages translations for FR, ES, EN
 */

const TRANSLATIONS = {
  fr: {
    appName: "SpinLux",
    tagline: "Roue de la Chance Premium",
    spinBtn: "LANCER LA ROUE",
    result: "Résultat",
    history: "Historique",
    historyEmpty: "Aucun lancer encore",
    clearHistory: "Effacer",
    myWheels: "Mes Roues",
    newWheel: "Nouvelle Roue",
    saveWheel: "Sauvegarder",
    importWheel: "Importer",
    exportWheel: "Exporter JSON",
    shareWheel: "Partager",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié !",
    wheelName: "Nom de la roue",
    sections: "Sections",
    addSection: "Ajouter une section",
    deleteSection: "Supprimer",
    sectionText: "Texte...",
    templates: "Modèles rapides",
    tplYesNo: "Oui / Non",
    tpl1to10: "1 à 10",
    tplColors: "Couleurs",
    tplDays: "Jours",
    tplMonths: "Mois",
    advancedWeights: "Poids avancés",
    weightLabel: "Poids",
    soundOn: "Son activé",
    soundOff: "Son désactivé",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter",
    deleteWheel: "Supprimer la roue",
    confirmDelete: "Supprimer cette roue ?",
    yes: "Oui",
    no: "Non",
    noSections: "Ajoutez au moins 2 sections",
    spinning: "La chance tourne…",
    winner: "Gagnant !",
    spinAgain: "Relancer",
    close: "Fermer",
    untitled: "Ma Roue",
    saved: "Sauvegardé !",
    sections_count: "sections",
    drag_hint: "Glissez pour réorganiser",
    color: "Couleur",
  },
  es: {
    appName: "SpinLux",
    tagline: "Ruleta de la Suerte Premium",
    spinBtn: "GIRAR LA RULETA",
    result: "Resultado",
    history: "Historial",
    historyEmpty: "Sin lanzamientos aún",
    clearHistory: "Borrar",
    myWheels: "Mis Ruletas",
    newWheel: "Nueva Ruleta",
    saveWheel: "Guardar",
    importWheel: "Importar",
    exportWheel: "Exportar JSON",
    shareWheel: "Compartir",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!",
    wheelName: "Nombre de la ruleta",
    sections: "Secciones",
    addSection: "Añadir sección",
    deleteSection: "Eliminar",
    sectionText: "Texto...",
    templates: "Plantillas rápidas",
    tplYesNo: "Sí / No",
    tpl1to10: "1 al 10",
    tplColors: "Colores",
    tplDays: "Días",
    tplMonths: "Meses",
    advancedWeights: "Pesos avanzados",
    weightLabel: "Peso",
    soundOn: "Sonido activado",
    soundOff: "Sonido desactivado",
    fullscreen: "Pantalla completa",
    exitFullscreen: "Salir",
    deleteWheel: "Eliminar ruleta",
    confirmDelete: "¿Eliminar esta ruleta?",
    yes: "Sí",
    no: "No",
    noSections: "Añade al menos 2 secciones",
    spinning: "La suerte está girando…",
    winner: "¡Ganador!",
    spinAgain: "Girar de nuevo",
    close: "Cerrar",
    untitled: "Mi Ruleta",
    saved: "¡Guardado!",
    sections_count: "secciones",
    drag_hint: "Arrastra para reorganizar",
    color: "Color",
  },
  en: {
    appName: "SpinLux",
    tagline: "Premium Luck Wheel",
    spinBtn: "SPIN THE WHEEL",
    result: "Result",
    history: "History",
    historyEmpty: "No spins yet",
    clearHistory: "Clear",
    myWheels: "My Wheels",
    newWheel: "New Wheel",
    saveWheel: "Save",
    importWheel: "Import",
    exportWheel: "Export JSON",
    shareWheel: "Share",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    wheelName: "Wheel name",
    sections: "Sections",
    addSection: "Add section",
    deleteSection: "Delete",
    sectionText: "Text...",
    templates: "Quick templates",
    tplYesNo: "Yes / No",
    tpl1to10: "1 to 10",
    tplColors: "Colors",
    tplDays: "Days",
    tplMonths: "Months",
    advancedWeights: "Advanced weights",
    weightLabel: "Weight",
    soundOn: "Sound on",
    soundOff: "Sound off",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit",
    deleteWheel: "Delete wheel",
    confirmDelete: "Delete this wheel?",
    yes: "Yes",
    no: "No",
    noSections: "Add at least 2 sections",
    spinning: "Luck is spinning…",
    winner: "Winner!",
    spinAgain: "Spin again",
    close: "Close",
    untitled: "My Wheel",
    saved: "Saved!",
    sections_count: "sections",
    drag_hint: "Drag to reorder",
    color: "Color",
  },
};

let currentLang = localStorage.getItem("spinlux_lang") || "fr";

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || key;
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem("spinlux_lang", lang);
  document.documentElement.lang = lang;
  applyTranslations();
  updateLangUI();
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
}

function updateLangUI() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

export { t, setLang, currentLang, applyTranslations, updateLangUI, TRANSLATIONS };
