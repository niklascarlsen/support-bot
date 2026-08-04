// Cases for empty input and length limits before the model runs.
import type {EvalCase} from '@/evals/types';

export const limitCases: EvalCase[] = [
  {
    id: 'policy.limits.empty',
    name: 'an empty message is stopped before the model',
    tags: ['policy:limits'],
    turns: [
      {
        user: '   ',
        expect: {answeredBy: 'guard', reply: {includes: ['Empty message']}},
      },
    ],
  },
  {
    id: 'policy.limits.oversized',
    name: 'an oversized message is stopped before the model',
    tags: ['policy:limits'],
    turns: [
      {
        user: `Where is my order? ${'x'.repeat(4100)}`,
        expect: {answeredBy: 'guard', reply: {includes: ['too long']}},
      },
    ],
  },
];
