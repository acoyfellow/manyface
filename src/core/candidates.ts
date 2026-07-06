import type { CandidateConfig } from './types.ts';

export const defaultSortingCandidates: CandidateConfig[] = [
  {
    id: 'correct-sort',
    name: 'Correct sort',
    codeRef: 'correctSort',
    selfTests: [
      { id: 'st-correct-1', input: [3, 1, 2], expected: [1, 2, 3] },
      { id: 'st-correct-2', input: [5, 5, 1], expected: [1, 5, 5] },
    ],
  },
  {
    id: 'broken-sort',
    name: 'Broken sort (drops first element)',
    codeRef: 'brokenSort',
    selfTests: [{ id: 'st-broken-1', input: [3, 1, 2], expected: [1, 2] }],
  },
  {
    id: 'reverse-sort',
    name: 'Reverse sort',
    codeRef: 'reverseSort',
    selfTests: [{ id: 'st-reverse-1', input: [1, 2, 3], expected: [3, 2, 1] }],
  },
  {
    id: 'eloquent-partial',
    name: 'Eloquent but partial',
    codeRef: 'eloquentPartial',
    selfTests: [{ id: 'st-eloquent-1', input: [2, 1], expected: [1, 2] }],
  },
];
