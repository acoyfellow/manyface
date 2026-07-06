import type { CellFunction } from '../adapters/local/containers.local.ts';

// Cell registry: pure functions that stand in for isolated candidate code.
// In a deployed container each function would be a sandboxed artifact.
export const sortingCellRegistry = new Map<string, CellFunction>([
  [
    'correctSort',
    (input: unknown) => {
      const arr = [...(input as number[])];
      return arr.sort((a, b) => a - b);
    },
  ],
  [
    'brokenSort',
    (input: unknown) => {
      const arr = [...(input as number[])];
      arr.shift();
      return arr.sort((a, b) => a - b);
    },
  ],
  [
    'reverseSort',
    (input: unknown) => {
      return [...(input as number[])].sort((a, b) => b - a);
    },
  ],
  [
    'eloquentPartial',
    (input: unknown) => {
      const arr = input as number[];
      // Looks smart but only handles tiny arrays correctly.
      if (arr.length <= 2) return [...arr].sort((a, b) => a - b);
      // Falls back to identity for larger inputs.
      return [...arr];
    },
  ],
]);
