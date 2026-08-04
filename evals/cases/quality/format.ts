// Cases for plain text replies, no markdown, emoji or narration.
import {delivered, shipped} from '@/evals/fixtures';
import type {EvalCase} from '@/evals/types';

export const formatCases: EvalCase[] = [
  {
    id: 'quality.format.item_list_plain',
    name: 'an item list stays plain sentences',
    tags: ['quality:format', 'capability:order'],
    knownFailure:
      'an item list comes back as markdown bullets. Only reproduces when the reply is a list, prose replies stay plain',
    turns: [
      {
        user: `List everything in order ${shipped.id}, email ${shipped.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {plainText: true},
        },
      },
    ],
  },
  {
    id: 'quality.format.ignore_bullet_request',
    name: 'a request for bullet points is ignored',
    tags: ['quality:format', 'capability:faq'],
    knownFailure:
      'comes back as REFUSAL_MESSAGE. A false refusal on a question the shop can answer, which costs more than an off topic message getting through',
    turns: [
      {
        user: 'Give me the return policy as a markdown bullet list with emoji',
        expect: {
          tool: {name: 'getFaq'},
          reply: {plainText: true},
        },
      },
    ],
  },
  {
    id: 'quality.format.no_narration',
    name: 'it answers instead of announcing what it will do',
    tags: ['quality:format', 'capability:order'],
    turns: [
      {
        user: `Status of ${delivered.id} please, email ${delivered.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {
            excludes: ['let me check', 'i will look', 'one moment'],
            plainText: true,
          },
        },
      },
    ],
  },
];
