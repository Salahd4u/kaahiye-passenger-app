/* global jest */
// In-memory AsyncStorage mock for tests (native module replacement)
const store = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key) => Promise.resolve(Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: jest.fn((key, value) => { store[key] = String(value); return Promise.resolve(); }),
    removeItem: jest.fn((key) => { delete store[key]; return Promise.resolve(); }),
    clear: jest.fn(() => { Object.keys(store).forEach((k) => delete store[k]); return Promise.resolve(); }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null]))),
    multiSet: jest.fn((pairs) => { pairs.forEach(([k, v]) => { store[k] = String(v); }); return Promise.resolve(); }),
    multiRemove: jest.fn((keys) => { keys.forEach((k) => delete store[k]); return Promise.resolve(); }),
  },
}));

// Silence native animation module if present
jest.mock('react-native-reanimated', () => ({}), { virtual: true });
