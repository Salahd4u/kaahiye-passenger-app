/**
 * Minimal Jest globals for TypeScript.
 *
 * The UI project does not ship Jest's type package; these declarations keep
 * the legacy unit tests type-safe during `tsc --noEmit`.
 */
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const expect: {
  (actual: unknown): {
    toBe(expected: unknown): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toContain(expected: unknown): void;
    toThrow(expected?: string): void;
    toBeGreaterThanOrEqual(expected: number): void;
    rejects: { toThrow(expected?: string): Promise<void> };
  };
};
