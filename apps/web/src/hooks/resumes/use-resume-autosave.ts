"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  resumeSummarySchema,
  type ResumeDocument,
  type SavedResume,
} from "@ogma/contracts/resume-workspace";
import {
  createResume,
  requestResume,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";

interface DraftSnapshot {
  title: string;
  document: ResumeDocument;
}

function matches(left: DraftSnapshot, right: DraftSnapshot) {
  return left.title === right.title && left.document === right.document;
}

export function useResumeAutosave(
  initial: SavedResume,
  title: string,
  draft: ResumeDocument,
  hasSectionDrafts: boolean,
) {
  const [phase, setPhase] = useState<"saved" | "saving" | "error" | "conflict">(
    "saved",
  );
  const [acknowledged, setAcknowledged] = useState({
    title: initial.title,
    document: initial.document,
  });
  const [conflictOpen, setConflictOpen] = useState(false);
  const queue = useRef({
    latest: { title: initial.title, document: initial.document },
    saved: { title: initial.title, document: initial.document },
    revision: initial.draftRevision,
    request: undefined as Promise<boolean> | undefined,
    conflict: false,
    allowNavigation: false,
    hasSectionDrafts,
    copy: undefined as { id: string; snapshot: DraftSnapshot } | undefined,
  });

  const flush = useCallback(async (): Promise<number | null> => {
    const state = queue.current;
    for (;;) {
      if (state.conflict) {
        setConflictOpen(true);
        return null;
      }
      // A pending write can change the saved draft even after a local revert.
      if (state.request) {
        if (!(await state.request)) return null;
        continue;
      }
      if (matches(state.latest, state.saved)) return state.revision;

      const snapshot = state.latest;
      setPhase("saving");
      state.request = requestResume(`/${initial.id}`, resumeSummarySchema, {
        method: "PATCH",
        body: { ...snapshot, expectedRevision: state.revision },
      })
        .then((result) => {
          state.revision = result.draftRevision;
          state.saved = snapshot;
          setAcknowledged(snapshot);
          setPhase("saved");
          return true;
        })
        .catch((error: unknown) => {
          if (
            error instanceof ResumeRequestError &&
            [404, 409].includes(error.status)
          ) {
            state.conflict = true;
            setPhase("conflict");
            setConflictOpen(true);
          } else {
            setPhase("error");
          }
          return false;
        })
        .finally(() => {
          state.request = undefined;
        });
    }
  }, [initial.id]);

  useLayoutEffect(() => {
    const state = queue.current;
    state.latest = { title, document: draft };
    state.hasSectionDrafts = hasSectionDrafts;
    if (matches(state.latest, state.saved) || state.conflict) return;
    const timer = window.setTimeout(() => void flush(), 600);
    return () => window.clearTimeout(timer);
  }, [title, draft, flush, hasSectionDrafts]);

  useEffect(() => {
    const state = queue.current;
    const guard = (event: BeforeUnloadEvent) => {
      if (
        state.allowNavigation ||
        (!state.hasSectionDrafts &&
          !state.request &&
          matches(state.latest, state.saved))
      )
        return;
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  const reloadFromServer = () => {
    queue.current.allowNavigation = true;
    window.location.reload();
  };

  const saveCopy = async () => {
    const state = queue.current;
    const previous = state.copy;
    const attempt =
      previous && matches(previous.snapshot, state.latest)
        ? previous
        : { id: crypto.randomUUID(), snapshot: state.latest };
    state.copy = attempt;
    const { title, document } = attempt.snapshot;
    const saved = await createResume({
      id: attempt.id,
      document,
      title: `${title.slice(0, 113)} (copy)`,
    });
    state.allowNavigation = true;
    window.location.assign(
      new URL(`/resumes/${saved.id}`, window.location.origin),
    );
  };

  const reportConflict = () => {
    queue.current.conflict = true;
    setPhase("conflict");
    setConflictOpen(true);
  };

  const dirty =
    phase === "saved" && !matches(acknowledged, { title, document: draft });

  return {
    phase: dirty ? "saving" : phase,
    conflictOpen,
    setConflictOpen,
    flush,
    reloadFromServer,
    saveCopy,
    reportConflict,
  };
}
