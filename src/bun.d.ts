// Type declarations for Bun built-in modules used in tests.
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeGreaterThan(n: number): void;
    toContain(expected: string): void;
  };
}

declare namespace Bun {
  function file(path: URL | string): {
    text(): Promise<string>;
    json(): Promise<Record<string, unknown>>;
  };
}
