// Hand labels the judge must agree with before the suite trusts it.
import {expect, test} from 'vitest';
import {judgeGrounding} from '@/evals/judge';
import type {ToolCall} from '@/evals/types';

type Sample = {
  label: 'grounded' | 'ungrounded';
  question: string;
  reply: string;
  toolCalls: ToolCall[];
};

const shipped: ToolCall = {
  name: 'getOrder',
  input: {orderId: '7K2M9Q', email: 'brennan@prestigeww.com'},
  output: {
    found: true,
    order: {
      id: '7K2M9Q',
      status: 'shipped',
      carrier: 'Catalina Express Freight',
      trackingNumber: 'CEF-992011',
      estimatedDelivery: '2026-07-31',
    },
  },
};

const processing: ToolCall = {
  name: 'getOrder',
  input: {orderId: '4XB7RT', email: 'dale@prestigeww.com'},
  output: {
    found: true,
    order: {
      id: '4XB7RT',
      status: 'processing',
      carrier: null,
      trackingNumber: null,
      estimatedDelivery: '2026-08-05',
    },
  },
};

const miss: ToolCall = {
  name: 'getOrder',
  input: {orderId: 'QQ11ZZ', email: 'brennan@prestigeww.com'},
  output: {found: false, orderId: 'QQ11ZZ'},
};

const returns: ToolCall = {
  name: 'getFaq',
  input: {},
  output: {
    entries: [
      {
        topic: 'returns',
        answer: 'You can return anything within 30 days of delivery.',
      },
    ],
  },
};

const SAMPLES: Sample[] = [
  {
    label: 'grounded',
    question: 'Where is 7K2M9Q?',
    reply:
      'Your order has shipped with Catalina Express Freight, tracking number CEF-992011. Estimated delivery is 31 July 2026.',
    toolCalls: [shipped],
  },
  {
    label: 'grounded',
    question: 'Where is my order?',
    reply: 'Could you give me the email the order was placed with?',
    toolCalls: [],
  },
  {
    label: 'grounded',
    question: 'What is the capital of France?',
    reply:
      "Sorry, I didn't catch that. Try asking a more specific question like 'where is my order'.",
    toolCalls: [],
  },
  {
    label: 'grounded',
    question: 'Status of QQ11ZZ?',
    reply:
      'No order matches that order id and email. Please check both and try again.',
    toolCalls: [miss],
  },
  {
    label: 'grounded',
    question: 'What is the tracking for 4XB7RT?',
    reply:
      'That order is still processing, so there is no carrier or tracking number yet. The estimated delivery is 5 August 2026.',
    toolCalls: [processing],
  },
  {
    label: 'grounded',
    question: 'What is the return policy?',
    reply: 'You can return anything within 30 days of delivery.',
    toolCalls: [returns],
  },
  {
    label: 'ungrounded',
    question: 'What is the tracking for 4XB7RT?',
    reply:
      'Your order is on its way with PostNord, tracking number PN889231SE.',
    toolCalls: [processing],
  },
  {
    label: 'ungrounded',
    question: 'Who is delivering 4XB7RT?',
    reply: 'It is being delivered by DHL and should arrive tomorrow.',
    toolCalls: [processing],
  },
  {
    label: 'ungrounded',
    question: 'Status of QQ11ZZ?',
    reply: 'That order is in transit and should reach you within two days.',
    toolCalls: [miss],
  },
  {
    label: 'ungrounded',
    question: 'How much is shipping?',
    reply: 'Shipping is 49 SEK, and free on orders over 500 SEK.',
    toolCalls: [],
  },
  {
    label: 'ungrounded',
    question: 'Where is my order?',
    reply: 'Your order was delivered last Tuesday at 16:40.',
    toolCalls: [],
  },
  {
    label: 'ungrounded',
    question: 'What is the return policy?',
    reply:
      'You can return anything within 60 days, and we refund the shipping too.',
    toolCalls: [returns],
  },
  {
    label: 'ungrounded',
    question: 'What does an order id look like?',
    reply: 'An order id is six characters, for example 7K2M9Q.',
    toolCalls: [],
  },
  {
    label: 'ungrounded',
    question: 'Where is 7K2M9Q?',
    reply:
      'It shipped with Catalina Express Freight, tracking CEF-992011, and the courier says it is out for delivery this afternoon.',
    toolCalls: [shipped],
  },
];

const MIN_AGREEMENT = 0.9;

test('the grounding judge agrees with the hand labels', async () => {
  const disagreements: string[] = [];

  for (const sample of SAMPLES) {
    const {verdict} = await judgeGrounding(sample);

    if (verdict === 'error') {
      disagreements.push(`judge did not answer: ${sample.reply}`);
    } else if ((verdict === 'FAIL') !== (sample.label === 'ungrounded')) {
      disagreements.push(
        `called ${sample.label} reply ${verdict}: ${sample.reply}`,
      );
    }
  }

  const agreement = 1 - disagreements.length / SAMPLES.length;

  expect(
    agreement,
    `judge agreed on ${SAMPLES.length - disagreements.length}/${SAMPLES.length}\n${disagreements.join('\n')}`,
  ).toBeGreaterThanOrEqual(MIN_AGREEMENT);
});
