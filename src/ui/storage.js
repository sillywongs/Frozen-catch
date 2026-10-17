// Persistent save data with an injectable storage backend for tests.
const KEY = 'frozen-catch-save-v1';

export function defaultData() {
  return {
    coins: 30,
    stars: {},
    inventory: { extraSlot: 1, shuffle: 1, undo: 1 },
    settings: { muted: false },
    endlessHigh: 0,
  };
}

export function createStorage(storage) {
  const backend =
    storage ||
    (typeof localStorage !== 'undefined'
      ? localStorage
      : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        });

  function load() {
    try {
      const raw = backend.getItem(KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return { ...defaultData(), ...parsed };
    } catch {
      return defaultData();
    }
  }

  function save(data) {
    backend.setItem(KEY, JSON.stringify(data));
  }

  function clear() {
    backend.removeItem(KEY);
  }

  return { load, save, clear, KEY };
}
