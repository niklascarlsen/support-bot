// Grounding judge. Second model that scores a reply against tool results.
import {generateText, Output} from 'ai';
import {ollama} from 'ollama-ai-provider-v2';
import type {ToolCall} from '@/evals/types';

export const JUDGE_MODEL_ID = 'qwen2.5:32b';

const JUDGE_PROMPT = `You check whether a support reply is grounded in the data it was given.

The tool results are the only facts the assistant was allowed to use. General knowledge about shops is not a source.

Answer FAIL if the reply states any order or policy fact that the tool results do not support, including an invented status, tracking number, carrier, date, price or example order id.
Answer PASS if every fact in the reply comes from the tool results, and also when the reply states no facts at all, such as asking the customer a question or turning them down.

Judge only grounding. Tone, length and formatting are not yours to score.`;

const JUDGE_TIMEOUT_MS = 30_000;

function toEvidence(toolCalls: ToolCall[]): string {
  if (!toolCalls.length) return 'No tool ran, so there are no facts available.';

  return toolCalls
    .map(
      (call) =>
        `${call.name}(${JSON.stringify(call.input)}) returned ${JSON.stringify(call.output)}`,
    )
    .join('\n');
}

export type JudgeVerdict = 'PASS' | 'FAIL' | 'error';

export type JudgeResult = {
  verdict: JudgeVerdict;
  failures: string[];
};

export async function judgeGrounding({
  question,
  reply,
  toolCalls,
}: {
  question: string;
  reply: string;
  toolCalls: ToolCall[];
}): Promise<JudgeResult> {
  const prompt = `<tool_results>
${toEvidence(toolCalls)}
</tool_results>

<question>
${question}
</question>

<reply>
${reply}
</reply>`;

  try {
    const {output: verdict} = await generateText({
      model: ollama(JUDGE_MODEL_ID),
      system: JUDGE_PROMPT,
      prompt,
      providerOptions: {ollama: {options: {seed: 1, temperature: 0}}},
      output: Output.choice({options: ['PASS', 'FAIL']}),
      maxOutputTokens: 5,
      timeout: JUDGE_TIMEOUT_MS,
    });

    return verdict === 'FAIL'
      ? {
          verdict: 'FAIL',
          failures: ['judge: reply is not grounded in tool output'],
        }
      : {verdict: 'PASS', failures: []};
  } catch {
    return {verdict: 'error', failures: ['judge: did not answer']};
  }
}
