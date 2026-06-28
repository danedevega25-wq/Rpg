/* Local Storage wrapper. Keeping persistence isolated makes future save migrations easier. */
window.SaveSystem = (() => {
  const KEY = 'meadowfall-save-v1';

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Save file could not be read and will be ignored.', error);
      return null;
    }
  }

  function hasSave() {
    return Boolean(localStorage.getItem(KEY));
  }

  return { save, load, hasSave };
})();
