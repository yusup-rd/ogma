"use client";
import { useQueryClient } from "@tanstack/react-query";
import { cacheResumeSummary } from "@/lib/queries/resume-queries";
import { notifyAfterNavigation } from "@/lib/notifications/navigation";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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

function sameContent(left: DraftSnapshot, right: DraftSnapshot) {
  return (
    left.title === right.title &&
    JSON.stringify(left.document) === JSON.stringify(right.document)
  );
}

export function useResumeAutosave(
  initial: SavedResume,
  title: string,
  draft: ResumeDocument,
  hasSectionDrafts: boolean,
) {
  const client = useQueryClient();
  const [phase, setPhase] = useState<"saved" | "saving" | "error" | "conflict">(
    "saved",
  );
  const [acknowledged, setAcknowledged] = useState({
    title: initial.title,
    document: initial.document,
  });
  const [conflictOpen, setConflictOpen] = useState(false);
  const [locked, setLocked] = useState(initial.locked);
  const [lockBusy, setLockBusy] = useState(false);
  const [lockError, setLockError] = useState("");
  const [lockPromptOpen, setLockPromptOpen] = useState(false);
  const queue = useRef({
    latest: { title: initial.title, document: initial.document },
    saved: { title: initial.title, document: initial.document },
    revision: initial.draftRevision,
    request: undefined as Promise<boolean> | undefined,
    conflict: false,
    allowNavigation: false,
    hasSectionDrafts,
    locked: initial.locked,
    changingLock: false,
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
      if (
        matches(state.latest, state.saved) ||
        (state.locked && sameContent(state.latest, state.saved))
      )
        return state.revision;
      if (state.locked) {
        setLockPromptOpen(true);
        return null;
      }

      const snapshot = state.latest;
      setPhase("saving");
      state.request = requestResume(`/${initial.id}`, resumeSummarySchema, {
        method: "PATCH",
        body: { ...snapshot, expectedRevision: state.revision },
      })
        .then(async (result) => {
          await cacheResumeSummary(client, result);
          state.revision = result.draftRevision;
          state.saved = snapshot;
          setAcknowledged(snapshot);
          if (!state.conflict) setPhase("saved");
          return true;
        })
        .catch((error: unknown) => {
          if (error instanceof ResumeRequestError && error.status === 423) {
            state.locked = true;
            state.conflict = true;
            setLocked(true);
            setConflictOpen(true);
            setPhase("conflict");
            return false;
          }
          if (
            error instanceof ResumeRequestError &&
            [404, 409].includes(error.status)
          ) {
            state.conflict = true;
            setPhase("conflict");
            setConflictOpen(true);
          } else if (!state.conflict) {
            setPhase("error");
          }
          return false;
        })
        .finally(() => {
          state.request = undefined;
        });
    }
  }, [initial.id, client]);

  useLayoutEffect(() => {
    const state = queue.current;
    state.latest = { title, document: draft };
    state.hasSectionDrafts = hasSectionDrafts;
    if (
      state.locked ||
      state.changingLock ||
      matches(state.latest, state.saved) ||
      state.conflict
    )
      return;
    const timer = window.setTimeout(() => void flush(), 600);
    return () => window.clearTimeout(timer);
  }, [title, draft, flush, hasSectionDrafts, locked, lockBusy]);

  useEffect(() => {
    const state = queue.current;
    const guard = (event: BeforeUnloadEvent) => {
      if (
        state.allowNavigation ||
        (!state.hasSectionDrafts &&
          !state.request &&
          (matches(state.latest, state.saved) ||
            (state.locked && sameContent(state.latest, state.saved))))
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
    if (state.hasSectionDrafts) return false;
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
    if (state.hasSectionDrafts || !matches(attempt.snapshot, state.latest))
      return false;
    state.allowNavigation = true;
    notifyAfterNavigation("Your edits were saved in a separate resume.");
    window.location.assign(
      new URL(`/resumes/${saved.id}`, window.location.origin),
    );
    return true;
  };

  const reportConflict = () => {
    queue.current.conflict = true;
    setPhase("conflict");
    setConflictOpen(true);
  };

  const changeLock = async (nextLocked: boolean) => {
    const state = queue.current;
    if (state.changingLock) return false;
    if (state.hasSectionDrafts) {
      setLockError(
        "Apply or cancel each edited section before changing the lock.",
      );
      return false;
    }
    state.changingLock = true;
    setLockBusy(true);
    setLockError("");
    try {
      if (nextLocked && (await flush()) === null) {
        setLockError(
          "Couldn’t save the CV. Retry saving before locking. Your edits are still here.",
        );
        return false;
      }
      if (state.hasSectionDrafts) {
        setLockError(
          "Apply or cancel each edited section before changing the lock.",
        );
        return false;
      }
      const snapshot = state.latest;
      const result = await requestResume(
        `/${initial.id}/lock`,
        resumeSummarySchema,
        {
          method: "POST",
          body: {
            locked: nextLocked,
            expectedRevision: state.revision,
            ...(!nextLocked ? snapshot : {}),
          },
        },
      );
      await cacheResumeSummary(client, result);
      state.revision = result.draftRevision;
      state.locked = result.locked;
      if (!nextLocked) {
        state.saved = snapshot;
        setAcknowledged(snapshot);
      }
      setLocked(result.locked);
      setPhase("saved");
      setLockPromptOpen(false);
      return !state.hasSectionDrafts && matches(snapshot, state.latest);
    } catch (error) {
      if (
        error instanceof ResumeRequestError &&
        [404, 409].includes(error.status)
      ) {
        state.conflict = true;
        setPhase("conflict");
        setConflictOpen(true);
      } else
        setLockError(
          "Couldn’t change the lock. Your preview changes are still here. Try again.",
        );
      return false;
    } finally {
      state.changingLock = false;
      setLockBusy(false);
    }
  };

  const previewChanged = useMemo(
    () => !sameContent({ title, document: draft }, acknowledged),
    [title, draft, acknowledged],
  );

  const dirty =
    phase === "saved" && !matches(acknowledged, { title, document: draft });

  return {
    phase: dirty && !locked ? "saving" : phase,
    locked,
    lockBusy,
    lockError,
    lockPromptOpen,
    setLockPromptOpen,
    changeLock,
    previewChanged,
    savedSnapshot: acknowledged,
    leaveWithoutChanges: () => {
      queue.current.allowNavigation = true;
    },
    conflictOpen,
    setConflictOpen,
    flush,
    reloadFromServer,
    saveCopy,
    reportConflict,
  };
}
