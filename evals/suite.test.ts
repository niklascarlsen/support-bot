// Runs every eval case, then writes the report.
import {afterAll, expect, test} from 'vitest';
import {cases} from '@/evals/cases/index';
import {checkTurn} from '@/evals/check';
import {writeReport, type RunEntry} from '@/evals/report';
import {runCase} from '@/evals/runner';
import type {EvalCase, TurnResult} from '@/evals/types';

const entries: RunEntry[] = [];

afterAll(() => {
  if (entries.length) writeReport(entries);
});

// One turn at a time. Concurrent Ollama calls hurt repeatability.
async function checksFor(evalCase: EvalCase, results: TurnResult[]) {
  const failuresPerTurn: string[][] = [];
  const judgePerTurn: Array<'PASS' | 'FAIL' | 'error' | null> = [];

  for (const [index, result] of results.entries()) {
    const check = await checkTurn(evalCase.turns[index].expect, result);
    failuresPerTurn.push(check.failures);
    judgePerTurn.push(check.judge);
  }

  return {failuresPerTurn, judgePerTurn};
}

// knownFailure runs as test.fails. npm run eval calibrates the judge first.
for (const evalCase of cases) {
  const run = evalCase.knownFailure ? test.fails : test;

  run(`${evalCase.id} ${evalCase.name}`, async () => {
    const results = await runCase(evalCase);
    const {failuresPerTurn, judgePerTurn} = await checksFor(evalCase, results);

    entries.push({evalCase, results, failuresPerTurn, judgePerTurn});
    expect(failuresPerTurn.flat()).toEqual([]);
  });
}
