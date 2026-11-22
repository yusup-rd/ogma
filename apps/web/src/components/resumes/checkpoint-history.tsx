"use client";
import { toast } from "sonner";
import { notifyAfterNavigation } from "@/lib/notifications/navigation";

import * as Dialog from "@radix-ui/react-dialog";
import {
  checkpointSchema,
  type ResumeCheckpoint,
} from "@ogma/contracts/resume-workspace";
import { useEffect, useRef, useState } from "react";
import { LuClock3 } from "react-icons/lu";
import { z } from "zod";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { formatDateTime } from "@/lib/formatUtil";
import { requestResume, ResumeRequestError } from "@/lib/resumes/resume-api";

interface CheckpointHistoryProps {
  resumeId: string;
  locked?: boolean;
  beforeAction: () => Promise<number | null>;
  onConflict: () => void;
  onRestored: () => void;
}

const checkpointList = z.array(checkpointSchema);
const restoreResult = z.object({ draftRevision: z.int().positive() });
const secondary =
  "min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60";

const CheckpointHistory = ({
  resumeId,
  locked = false,
  beforeAction,
  onConflict,
  onRestored,
}: CheckpointHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ResumeCheckpoint[]>();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const ids = useRef(new Map<string, string>());
  const base = `/${resumeId}/checkpoints`;

  useEffect(() => {
    if (!open) return;
    let active = true;
    void requestResume(base, checkpointList)
      .then((result) => {
        if (active) setRows(result);
      })
      .catch(() => {
        if (active) setError("Couldn’t load checkpoint history.");
      });
    return () => {
      active = false;
    };
  }, [base, open, retry]);

  const operationId = (key: string) => {
    const id = ids.current.get(key) ?? crypto.randomUUID();
    ids.current.set(key, id);
    return id;
  };

  const onFailure = (error: unknown) => {
    if (
      error instanceof ResumeRequestError &&
      [404, 409].includes(error.status)
    ) {
      setOpen(false);
      onConflict();
      return true;
    }
    return false;
  };

  const saveCheckpoint = async () => {
    setBusy(true);
    setError("");
    try {
      const expectedRevision = await beforeAction();
      if (expectedRevision === null) {
        setOpen(false);
        return;
      }
      const key = `save/${expectedRevision}/${name.trim()}`;
      const checkpoint = await requestResume(base, checkpointSchema, {
        method: "POST",
        body: { id: operationId(key), name: name.trim(), expectedRevision },
      });
      ids.current.delete(key);
      setRows((current) => [
        checkpoint,
        ...(current ?? []).filter(({ id }) => id !== checkpoint.id),
      ]);
      setName("");
      toast.success("Checkpoint saved.");
    } catch (error) {
      if (!onFailure(error))
        setError("Couldn’t save this checkpoint. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (checkpoint: ResumeCheckpoint) => {
    setBusy(true);
    try {
      const expectedRevision = await beforeAction();
      if (expectedRevision === null) {
        setOpen(false);
        return;
      }
      const key = `restore/${checkpoint.id}/${expectedRevision}`;
      await requestResume(`${base}/${checkpoint.id}/restore`, restoreResult, {
        method: "POST",
        body: { id: operationId(key), expectedRevision },
      });
      ids.current.delete(key);
      notifyAfterNavigation("Checkpoint restored.");
      onRestored();
    } catch (error) {
      if (!onFailure(error))
        throw new Error("Couldn’t restore this checkpoint. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (next) {
          setError("");
          setRows(undefined);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Checkpoint history"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-2.5 text-sm font-semibold hover:bg-canvas"
        >
          <LuClock3 aria-hidden="true" className="size-4 shrink-0" />
          <span className="hidden xl:inline">History</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-30 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-2xl border border-line bg-paper p-5 shadow-xl sm:p-6">
          <Dialog.Title className="text-xl font-semibold tracking-tight">
            Checkpoint history
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted">
            {locked
              ? "This CV is locked. You can save or view checkpoints, but must unlock it before restoring one."
              : "Save a named version of this resume to revisit later."}
          </Dialog.Description>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCheckpoint();
            }}
          >
            <label className="flex min-w-32 flex-1 flex-col gap-1.5 text-sm font-semibold">
              Checkpoint name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !name.trim() || !rows}
              className="min-h-11 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              Save checkpoint
            </button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          {!rows &&
            (error ? (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setError("");
                  setRetry((value) => value + 1);
                }}
              >
                Retry history
              </button>
            ) : (
              <p role="status" className="text-sm text-muted">
                Loading checkpoints…
              </p>
            ))}
          {rows &&
            (rows.length ? (
              <ul className="divide-y divide-line">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words">
                        {row.name}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(row.createdAt)} · Revision{" "}
                        {row.draftRevision}
                      </p>
                    </div>
                    <ConfirmationDialog
                      trigger={
                        <button
                          type="button"
                          disabled={busy || locked}
                          className={secondary}
                          aria-label={`Restore ${row.name}`}
                        >
                          Restore
                        </button>
                      }
                      title="Restore checkpoint?"
                      description={`Replace the current draft with “${row.name}” and save it as a new revision.`}
                      confirmLabel="Restore"
                      action={() => restore(row)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No checkpoints yet.</p>
            ))}
          <Dialog.Close asChild>
            <button
              type="button"
              disabled={busy}
              className={`${secondary} self-end`}
            >
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { CheckpointHistory };
