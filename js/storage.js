/* Local Storage wrapper. Saves are versioned so future systems can migrate safely. */
window.SaveSystem = (() => {
  const KEY = 'character-forge-save-v1';

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now(), version: 1 }));
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (error) {
      console.warn('Save file could not be read and will be ignored.', error);
      return null;
    }
  }

  function hasSave() { return Boolean(localStorage.getItem(KEY)); }

  return { save, load, hasSave };
})();
