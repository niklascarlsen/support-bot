// Cases for order lookup, privacy misses and multi turn memory.
import {delivered, processing, shipped, unknownOrderId} from '@/evals/fixtures';
import type {EvalCase} from '@/evals/types';

export const orderCases: EvalCase[] = [
  {
    id: 'order.lookup.happy',
    name: 'id and email in one message is a single lookup',
    tags: ['capability:order', 'tool:getOrder'],
    turns: [
      {
        user: `Where is order ${shipped.id}? The email is ${shipped.email}`,
        expect: {
          tool: {
            name: 'getOrder',
            input: {orderId: shipped.id, email: shipped.email},
            found: true,
          },
          reply: {includes: [shipped.status], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.unknown_id',
    name: 'an unknown id finds nothing',
    tags: ['capability:order', 'tool:getOrder'],
    turns: [
      {
        user: `Check order ${unknownOrderId} for me, my email is ${shipped.email}`,
        expect: {
          tool: {name: 'getOrder', found: false},
          reply: {
            excludes: [shipped.status, delivered.status],
            plainText: true,
          },
        },
      },
    ],
  },
  {
    id: 'order.lookup.wrong_email',
    name: 'a real id with the wrong email does not confirm the id',
    tags: ['capability:order', 'tool:getOrder', 'risk:privacy'],
    turns: [
      {
        user: `Order ${shipped.id}, email ${processing.email}. What is the status?`,
        expect: {
          tool: {name: 'getOrder', found: false},
          // Must read like an unknown id. Naming status would confirm it.
          reply: {
            excludes: [
              shipped.status,
              shipped.carrier!,
              shipped.trackingNumber!,
            ],
            plainText: true,
          },
        },
      },
    ],
  },
  {
    id: 'order.lookup.ask_email_first',
    name: 'with nothing given it asks for the email and not the id',
    tags: ['capability:order'],
    turns: [
      {
        user: 'Where is my order?',
        expect: {
          tool: 'none',
          reply: {
            includes: ['email'],
            excludes: ['order id', 'order number'],
            plainText: true,
          },
        },
      },
    ],
  },
  {
    id: 'order.lookup.email_then_id',
    name: 'email first, then the id, then the lookup',
    tags: ['capability:order', 'tool:getOrder', 'path:multi-turn'],
    turns: [
      {
        user: 'I want to check on my order',
        expect: {
          tool: 'none',
          reply: {includes: ['email'], excludes: ['order id']},
        },
      },
      {
        user: processing.email,
        expect: {
          tool: 'none',
          reply: {includes: ['order id']},
        },
      },
      {
        user: processing.id,
        expect: {
          tool: {
            name: 'getOrder',
            input: {orderId: processing.id, email: processing.email},
            found: true,
          },
          reply: {includes: [processing.status], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.normalized_id',
    name: 'a lowercase id with spaces still matches',
    tags: ['capability:order', 'tool:getOrder'],
    turns: [
      {
        user: `my email is ${delivered.email} and the order is  ${delivered.id.toLowerCase()} `,
        expect: {
          // execute trims and uppercases.
          tool: {name: 'getOrder', found: true},
          reply: {includes: [delivered.status], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.remembers_earlier_id',
    name: 'an id given four turns earlier is still used',
    tags: ['capability:order', 'tool:getOrder', 'path:multi-turn'],
    turns: [
      {
        user: `Hi, I have a question about order ${shipped.id}`,
        expect: {tool: 'none'},
      },
      {
        user: 'Actually first, what is your return policy?',
        expect: {tool: {name: 'getFaq'}},
      },
      {
        user: `Thanks. My email is ${shipped.email}`,
        expect: {
          // Email only. Id must come from turn one.
          tool: {
            name: 'getOrder',
            input: {orderId: shipped.id, email: shipped.email},
            found: true,
          },
          reply: {plainText: true},
        },
      },
      {
        user: 'So has that order shipped yet?',
        expect: {
          // Lookup already happened. Answer from the transcript is fine.
          reply: {includes: [shipped.status], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.delivered',
    name: 'a delivered order reports the delivery',
    tags: ['capability:order', 'tool:getOrder'],
    turns: [
      {
        user: `Did order ${delivered.id} arrive? Email ${delivered.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {includes: [delivered.status], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.no_tracking_while_processing',
    name: 'a processing order has no tracking to report',
    tags: ['capability:order', 'tool:getOrder'],
    turns: [
      {
        user: `What is the tracking number for ${processing.id}? Email ${processing.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          // carrier and trackingNumber are null here.
          reply: {
            excludes: [
              shipped.carrier!,
              shipped.trackingNumber!,
              delivered.carrier!,
              delivered.trackingNumber!,
            ],
            plainText: true,
          },
        },
      },
    ],
  },
  {
    id: 'order.lookup.no_customer_name',
    name: 'the customer name is not in the tool output to give away',
    tags: ['capability:order', 'tool:getOrder', 'risk:privacy'],
    turns: [
      {
        user: `Order ${shipped.id}, email ${shipped.email}. What name is on it?`,
        expect: {
          tool: {name: 'getOrder', found: true},
          // toPublicOrder strips customer and email.
          reply: {excludes: [shipped.customer], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.items',
    name: 'it reports the items when asked for them',
    tags: ['capability:order', 'tool:getOrder'],
    knownFailure:
      'item list comes back as markdown bullets. Same format finding as quality.format.item_list_plain',
    turns: [
      {
        user: `What is in order ${shipped.id}? My email is ${shipped.email}`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {includes: [shipped.items[0].name], plainText: true},
        },
      },
    ],
  },
  {
    id: 'order.lookup.second_order',
    name: 'a second lookup does not reuse the first order',
    tags: ['capability:order', 'tool:getOrder', 'path:multi-turn'],
    turns: [
      {
        user: `Order ${shipped.id}, email ${shipped.email}, what is the status?`,
        expect: {
          tool: {name: 'getOrder', found: true},
          reply: {includes: [shipped.status]},
        },
      },
      {
        user: `And what about ${delivered.id}, email ${delivered.email}?`,
        expect: {
          tool: {
            name: 'getOrder',
            input: {orderId: delivered.id, email: delivered.email},
            found: true,
          },
          reply: {includes: [delivered.status], plainText: true},
        },
      },
    ],
  },
];
