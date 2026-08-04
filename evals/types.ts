// Shared shapes for cases, expectations and turn results.

// Grouped so input/found cannot sit without a tool name.
export type ToolExpectation = {
  name: 'getOrder' | 'getFaq';
  // Extra fields on the real call are ignored.
  input?: Record<string, unknown>;
  // Undefined means do not care.
  found?: boolean;
};

export type ReplyExpectation = {
  // Exact REFUSAL_MESSAGE.
  refusal?: boolean;
  // Case insensitive substrings.
  includes?: string[];
  excludes?: string[];
  // No markdown or emoji.
  plainText?: boolean;
  // Send the reply to the grounding judge.
  grounded?: boolean;
};

// Every field optional. A case only states what it cares about.
export type Expectation = {
  // Defaults to model. Guard blocks never reach saveChat.
  answeredBy?: 'model' | 'guard';
  // 'none' means no tool may run.
  tool?: ToolExpectation | 'none';
  reply?: ReplyExpectation;
  // Defaults to 200. A guard block is still 200.
  status?: number;
};

export type Turn = {
  user: string;
  expect: Expectation;
};

export type EvalCase = {
  // Stable key for reports and diffs.
  id: string;
  name: string;
  // e.g. capability:order, tool:getOrder.
  tags: string[];
  // Expected red. Drop when the case starts passing.
  knownFailure?: string;
  turns: Turn[];
};

export type ToolCall = {
  name: string;
  input: unknown;
  output: unknown;
};

export type TurnResult = {
  user: string;
  status: number;
  text: string;
  toolCalls: ToolCall[];
  saved: number;
};
