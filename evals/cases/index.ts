// Full eval case list.
import type {EvalCase} from '@/evals/types';
import {injectionCases} from '@/evals/cases/adversarial/injection';
import {faqCases} from '@/evals/cases/capability/faq';
import {orderCases} from '@/evals/cases/capability/order';
import {limitCases} from '@/evals/cases/policy/limits';
import {topicCases} from '@/evals/cases/policy/topic';
import {formatCases} from '@/evals/cases/quality/format';
import {groundingCases} from '@/evals/cases/quality/grounding';

export const cases: EvalCase[] = [
  ...orderCases,
  ...faqCases,
  ...topicCases,
  ...limitCases,
  ...injectionCases,
  ...formatCases,
  ...groundingCases,
];
