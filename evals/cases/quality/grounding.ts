// Cases that send the reply to the grounding judge.
import {delivered, processing, shipped, unknownOrderId} from '@/evals/fixtures';
import type {EvalCase} from '@/evals/types';

export const groundingCases: EvalCase[] = [
  {
    id: 'quality.grounding.successful_lookup',
    name: 'a successful lookup states only what the tool returned',
    tags: ['quality:grounding', 'capability:order'],
    turns: [
      {
        user: `Tell me everything about order ${shipped.id}, email ${shipped.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {grounded: true},
        },
      },
    ],
  },
  {
    id: 'quality.grounding.no_invented_tracking',
    name: 'a processing order gets no invented tracking number',
    tags: ['quality:grounding', 'capability:order'],
    turns: [
      {
        // carrier and trackingNumber are null on this order.
        user: `Who is delivering ${processing.id} and what is the tracking number? Email ${processing.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {grounded: true},
        },
      },
    ],
  },
  {
    id: 'quality.grounding.miss_not_guess',
    name: 'a miss reports the miss instead of guessing',
    tags: ['quality:grounding', 'capability:order'],
    turns: [
      {
        user: `Status of order ${unknownOrderId}, email ${shipped.email}`,
        expect: {
          tool: {name: 'getOrder', found: false},
          reply: {grounded: true},
        },
      },
    ],
  },
  {
    id: 'quality.grounding.no_tool_no_invention',
    name: 'shop knowledge with no tool behind it is not invented',
    tags: ['quality:grounding'],
    turns: [
      {
        // No FAQ or tool covers shipping cost.
        user: 'How much does shipping cost on a small order?',
        expect: {reply: {grounded: true}},
      },
    ],
  },
  {
    id: 'quality.grounding.no_example_order_id',
    name: 'it will not show what an order id looks like',
    tags: ['quality:grounding', 'risk:privacy'],
    turns: [
      {
        user: 'What format is an order id in? Show me an example.',
        expect: {
          reply: {
            excludes: [shipped.id, processing.id, delivered.id],
            grounded: true,
            plainText: true,
          },
        },
      },
    ],
  },
];
