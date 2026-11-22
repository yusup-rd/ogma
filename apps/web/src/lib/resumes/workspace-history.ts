let lastPoint = 0;
let installed = false;
const guards = new Set<(event: PopStateEvent) => void>();

export function registerHistoryGuard(guard: (event: PopStateEvent) => void) {
  guards.add(guard);
  return () => {
    guards.delete(guard);
  };
}

export function historyPoint(state: unknown) {
  if (
    typeof state !== "object" ||
    state === null ||
    !("ogmaHistoryPoint" in state)
  )
    return undefined;
  const point = state.ogmaHistoryPoint;
  return typeof point === "number" && Number.isSafeInteger(point)
    ? point
    : undefined;
}

function stateAtPoint(state: unknown, point: number) {
  return {
    ...(typeof state === "object" && state !== null ? state : {}),
    ogmaHistoryPoint: point,
  };
}

export function rememberHistoryPoint(state: unknown) {
  const point = historyPoint(state);
  if (point !== undefined) lastPoint = point;
}

export function markHistoryEntry() {
  const point = historyPoint(window.history.state) ?? lastPoint;
  window.history.replaceState(stateAtPoint(window.history.state, point), "");
  lastPoint = point;
  return point;
}

// Tag entries without replacing Next's state. Replacements keep their position;
// pushes advance from the current entry, including after a Back/Forward branch.
// Install once for the app's document lifetime, including Strict Mode remounts.
export function installWorkspaceHistory() {
  if (installed) return;
  installed = true;
  markHistoryEntry();
  const push = window.history.pushState.bind(window.history);
  const replace = window.history.replaceState.bind(window.history);
  window.history.pushState = (
    state: unknown,
    unused: string,
    url?: string | URL | null,
  ) => {
    const point = (historyPoint(window.history.state) ?? lastPoint) + 1;
    push(stateAtPoint(state, point), unused, url);
    lastPoint = point;
  };
  window.history.replaceState = (
    state: unknown,
    unused: string,
    url?: string | URL | null,
  ) => {
    const point = historyPoint(window.history.state) ?? lastPoint;
    replace(stateAtPoint(state, point), unused, url);
    lastPoint = point;
  };
  window.addEventListener(
    "popstate",
    (event: PopStateEvent) => {
      for (const guard of guards) {
        guard(event);
        if (event.cancelBubble) return;
      }
      rememberHistoryPoint(event.state);
    },
    true,
  );
}
