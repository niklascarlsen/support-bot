// Writes one JSON file per eval run under runs/.
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CHAT_MODEL_ID, GUARD_MODEL_ID} from '@/lib/config';
import {JUDGE_MODEL_ID} from '@/evals/judge';
import type {EvalCase, TurnResult} from '@/evals/types';

export type RunEntry = {
  evalCase: EvalCase;
  results: TurnResult[];
  failuresPerTurn: string[][];
  judgePerTurn: Array<'PASS' | 'FAIL' | 'error' | null>;
};

const RUNS_DIR = fileURLToPath(new URL('../runs', import.meta.url));

function toCaseReport(entry: RunEntry) {
  return {
    id: entry.evalCase.id,
    name: entry.evalCase.name,
    tags: entry.evalCase.tags,
    knownFailure: entry.evalCase.knownFailure,
    turns: entry.results.map((result, index) => ({
      user: result.user,
      reply: result.text,
      toolCalls: result.toolCalls.map((call) => call.name),
      // Guard blocks never save, so the store tells the layers apart.
      answeredBy: result.saved ? 'model' : 'guard',
      judge: entry.judgePerTurn[index] ?? null,
      failures: entry.failuresPerTurn[index] ?? [],
    })),
  };
}

function summarize(entries: RunEntry[]) {
  const failed = entries.filter((entry) =>
    entry.failuresPerTurn.some((failures) => failures.length),
  );
  const [known, real] = [
    failed.filter((entry) => entry.evalCase.knownFailure),
    failed.filter((entry) => !entry.evalCase.knownFailure),
  ];

  const fixed = entries.filter(
    (entry) =>
      entry.evalCase.knownFailure &&
      entry.failuresPerTurn.every((failures) => !failures.length),
  );

  const judged = entries.flatMap((entry) =>
    entry.judgePerTurn.filter((verdict) => verdict !== null),
  );

  return {
    total: entries.length,
    passed: entries.length - failed.length,
    failed: real.length,
    knownFailures: known.length,
    failedIds: real.map((entry) => entry.evalCase.id),
    knownFailureIds: known.map((entry) => entry.evalCase.id),
    nowPassingIds: fixed.map((entry) => entry.evalCase.id),
    judgeCalls: judged.length,
    judgePass: judged.filter((verdict) => verdict === 'PASS').length,
    judgeFail: judged.filter((verdict) => verdict === 'FAIL').length,
    judgeError: judged.filter((verdict) => verdict === 'error').length,
  };
}

export function writeReport(entries: RunEntry[]): string {
  mkdirSync(RUNS_DIR, {recursive: true});

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${RUNS_DIR}/${stamp}.json`;

  const body = {
    chatModel: CHAT_MODEL_ID,
    guardModel: GUARD_MODEL_ID,
    judgeModel: JUDGE_MODEL_ID,
    summary: summarize(entries),
    cases: entries.map(toCaseReport).sort((a, b) => a.id.localeCompare(b.id)),
  };

  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);

  return path;
}
