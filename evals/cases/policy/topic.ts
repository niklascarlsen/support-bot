// Cases for the topic guard allow and block paths.
import {shipped} from '@/evals/fixtures';
import type {EvalCase} from '@/evals/types';

export const topicCases: EvalCase[] = [
  {
    id: 'policy.topic.weather',
    name: 'the weather is for a different assistant',
    tags: ['policy:topic'],
    turns: [
      {
        user: 'What is the weather in Stockholm tomorrow?',
        expect: {answeredBy: 'guard'},
      },
    ],
  },
  {
    id: 'policy.topic.recipe',
    name: 'a recipe is off topic',
    tags: ['policy:topic'],
    turns: [
      {user: 'Give me a recipe for pancakes', expect: {answeredBy: 'guard'}},
    ],
  },
  {
    id: 'policy.topic.coding',
    name: 'a coding question is off topic',
    tags: ['policy:topic'],
    turns: [
      {
        user: 'Write me a python function that reverses a string',
        expect: {answeredBy: 'guard'},
      },
    ],
  },
  {
    id: 'policy.topic.mid_order_thread',
    name: 'off topic is still off topic mid order thread',
    tags: ['policy:topic', 'path:multi-turn'],
    turns: [
      {
        user: `Order ${shipped.id}, email ${shipped.email}, where is it?`,
        expect: {tool: {name: 'getOrder', found: true}},
      },
      {
        // An order thread must not buy a general knowledge question in.
        user: 'Great. While I have you, who won the world cup in 1998?',
        expect: {answeredBy: 'guard'},
      },
    ],
  },
  {
    id: 'policy.topic.short_reply_allowed',
    name: 'a short reply is not off topic',
    tags: ['policy:topic', 'path:multi-turn'],
    turns: [
      // answeredBy is the point of these turns.
      {user: 'I need help with a delivery', expect: {answeredBy: 'model'}},
      {
        user: 'ok',
        expect: {answeredBy: 'model'},
      },
    ],
  },
  {
    id: 'policy.topic.unclear_allowed',
    name: 'an unclear reply is not off topic',
    tags: ['policy:topic'],
    turns: [{user: 'hmm not sure', expect: {answeredBy: 'model'}}],
  },
  {
    id: 'policy.topic.swedish_allowed',
    name: 'a Swedish order question gets through',
    tags: ['policy:topic'],
    turns: [
      {
        user: 'Var är min beställning?',
        expect: {answeredBy: 'model'},
      },
    ],
  },
];
