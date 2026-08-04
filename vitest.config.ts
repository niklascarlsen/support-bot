import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  // Mirrors the `@/*` alias from tsconfig.json.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  // `import 'server-only'` in lib/ throws in plain Node. The empty module sits
  // behind the react-server condition, and it has to be asked for under ssr,
  // a top level resolve.conditions never reaches a test module.
  ssr: {resolve: {conditions: ['react-server', 'node', 'import', 'default']}},
  test: {
    environment: 'node',
    // A test sits next to what it tests, so pick them up wherever they are.
    // npm test excludes evals/, that is the only split that matters here,
    // one half needs a model and the other does not.
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    // Ollama serializes anyway, and parallel runs only make the result less
    // repeatable. Evals need this, the contract tests do not care.
    fileParallelism: false,
    testTimeout: 120_000,
  },
});
