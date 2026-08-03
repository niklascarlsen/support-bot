import type {RemendOptions} from 'remend';

/**
 * Temporary workaround. Delete this file once remend handles the case.
 *
 * This belongs upstream, not here. remend exists to repair incomplete markdown
 * while streaming, and it covers nine cases already, so a bare marker with no
 * text yet is a gap rather than something every app should patch itself. The
 * general problem is known, see vercel/streamdown issue 313, where the reporter
 * argues these edge cases belong in core remend instead of everyone keeping
 * their own version. That issue was closed without covering this, and our exact
 * case is not reported yet.
 *
 * To check whether it can go, drop the `remend` prop in MessageItem and stream
 * a reply that uses asterisk bullets with bold labels, which is what gemma4
 * writes. No flashing rule and no stray asterisks means this file can be
 * removed.
 *
 * Hides emphasis markers that have arrived without their text yet.
 *
 * remend completes `**text` into `**text**`, but it leaves a bare `**` alone
 * because there is nothing to wrap. That one token wide gap is visible in two
 * ways while streaming:
 *
 * - `*   1 x **` renders a literal `**` in the list item.
 * - `*   **` renders a horizontal rule, because CommonMark reads three or more
 *   matching markers as a thematic break even when spaces separate them. Only
 *   asterisk bullets hit this, hyphen bullets do not.
 *
 * Real rules like `---`, `***` and `___` are uniform and stay untouched.
 */
function stripDanglingMarkers(text: string): string {
  const line = text.slice(text.lastIndexOf('\n') + 1);

  // A line of nothing but identical markers is a real rule, so keep it.
  if (/^ {0,3}(\*{3,}|-{3,}|_{3,})[ \t]*$/.test(line)) return text;

  return text.replace(/[*_]+$/, '');
}

export const REMEND: RemendOptions = {
  // Must run before remend closes bold and italic, which is priority 30 to 42.
  handlers: [
    {name: 'danglingMarkers', handle: stripDanglingMarkers, priority: 25},
  ],
};
