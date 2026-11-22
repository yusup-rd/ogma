import { useEffect, useLayoutEffect, useRef } from "react";
import {
  historyPoint,
  markHistoryEntry,
  rememberHistoryPoint,
  registerHistoryGuard,
} from "@/lib/resumes/workspace-history";

export function useResumeHistoryGuard(
  isDirty: () => boolean,
  onLeave: (proceed: () => void) => void,
) {
  const latest = useRef({ isDirty, onLeave });
  const traversal = useRef({
    point: 0,
    restoring: false,
    destination: 0,
    permitted: false,
  });
  useLayoutEffect(() => {
    latest.current = { isDirty, onLeave };
    if (!traversal.current.restoring)
      traversal.current.point = markHistoryEntry();
  }, [isDirty, onLeave]);
  useEffect(() => {
    const guard = (event: PopStateEvent) => {
      const state = traversal.current;
      const point = state.point;
      const next = historyPoint(event.state);
      if (next === undefined) return;
      if (state.permitted) {
        state.permitted = false;
        return;
      }
      if (state.restoring) {
        event.stopImmediatePropagation();
        if (next !== point) {
          window.history.go(point - next);
          return;
        }
        rememberHistoryPoint(event.state);
        state.restoring = false;
        latest.current.onLeave(() => {
          state.permitted = true;
          window.history.go(state.destination - point);
        });
        return;
      }
      if (next === point || !latest.current.isDirty()) return;
      // Restore the current entry before Next handles the traversal. Preserve
      // the history stack and let the existing save/discard flow decide to leave.
      event.stopImmediatePropagation();
      state.destination = next;
      state.restoring = true;
      window.history.go(point - next);
    };
    return registerHistoryGuard(guard);
  }, []);
}
