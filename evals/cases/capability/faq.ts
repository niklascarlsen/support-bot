// Cases for FAQ answers from getFaq.
import type {EvalCase} from '@/evals/types';

export const faqCases: EvalCase[] = [
  {
    id: 'faq.returns',
    name: 'the return policy comes from the tool',
    tags: ['capability:faq', 'tool:getFaq'],
    turns: [
      {
        user: 'What is your return policy?',
        expect: {
          tool: {name: 'getFaq'},
          reply: {includes: ['30 days'], plainText: true},
        },
      },
    ],
  },
  {
    id: 'faq.damaged',
    name: 'a damaged item gets the reporting window',
    tags: ['capability:faq', 'tool:getFaq'],
    turns: [
      {
        user: 'My package arrived and the item inside is broken',
        expect: {
          tool: {name: 'getFaq'},
          reply: {includes: ['14 days'], plainText: true},
        },
      },
    ],
  },
  {
    id: 'faq.contact',
    name: 'contact details come from the tool',
    tags: ['capability:faq', 'tool:getFaq'],
    turns: [
      {
        user: 'How do I reach a real person?',
        expect: {
          tool: {name: 'getFaq'},
          reply: {includes: ['support@prestigeww.com'], plainText: true},
        },
      },
    ],
  },
  {
    id: 'faq.refund_without_order_id',
    name: 'a policy question is answered without asking for an order id',
    tags: ['capability:faq', 'tool:getFaq'],
    turns: [
      {
        user: 'When do I get my money back after a return?',
        expect: {
          // FAQ is the same for every customer. Call it before asking.
          tool: {name: 'getFaq'},
          reply: {
            includes: ['5 working days'],
            excludes: ['order id', 'your email'],
            plainText: true,
          },
        },
      },
    ],
  },
  {
    id: 'faq.uncovered_refuses',
    name: 'a question no entry covers is turned down, not invented',
    tags: ['capability:faq'],
    turns: [
      {
        user: 'Do you ship to Norway, and what does it cost?',
        expect: {
          reply: {refusal: true, plainText: true},
        },
      },
    ],
  },
];
