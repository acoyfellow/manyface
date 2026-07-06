import type { AdversaryConfig } from './types.ts';

export const defaultSortingAdversaries: AdversaryConfig[] = [
  {
    id: 'edge-host',
    name: 'Edge case hostile',
    counterexamples: [
      { id: 'cx-empty', input: [], expected: [] },
      { id: 'cx-single', input: [42], expected: [42] },
      { id: 'cx-duplicates', input: [2, 2, 1, 1], expected: [1, 1, 2, 2] },
    ],
  },
  {
    id: 'range-host',
    name: 'Range hostile',
    counterexamples: [
      { id: 'cx-negatives', input: [-3, 0, 5, -1], expected: [-3, -1, 0, 5] },
      { id: 'cx-mixed', input: [10, -2, 7, 0, 3], expected: [-2, 0, 3, 7, 10] },
    ],
  },
  {
    id: 'scale-host',
    name: 'Scale hostile',
    counterexamples: [
      {
        id: 'cx-large',
        input: [9, 1, 8, 2, 7, 3, 6, 4, 5, 0],
        expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
    ],
  },
];
