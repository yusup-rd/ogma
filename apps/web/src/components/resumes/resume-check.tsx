"use client";

import { useEffect, useRef, useState } from "react";
import {
  analysisResultSchema,
  type AnalysisResult,
} from "@ogma/contracts/resume-analysis";
import { requestResume, ResumeRequestError } from "@/lib/resumes/resume-api";
import { z } from "zod";
import { DropdownSelect } from "@/components/ui/dropdown-select";

interface ResumeCheckProps {
  resumeId: string;
  documentKey: string;
  dirty: boolean;
  initialRevision: number;
  initialDocumentKey: string;
  beforeRun: () => Promise<number | null>;
  onConflict: () => void;
}

const ResumeCheck = ({
  resumeId,
  documentKey,
  dirty,
  initialRevision,
  initialDocumentKey,
  beforeRun,
  onConflict,
}: ResumeCheckProps) => {
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checkedKey, setCheckedKey] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const currentKey = useRef(documentKey);
  const loading = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    currentKey.current = documentKey;
  }, [documentKey]);
  useEffect(() => {
    const controller = new AbortController();
    loading.current = controller;
    void requestResume(
      `/${resumeId}/analysis/${format}`,
      z.object({ result: analysisResultSchema.nullable() }),
      undefined,
      controller.signal,
    )
      .then(({ result: value }) => {
        if (!controller.signal.aborted) {
          setResult(value);
          setCheckedKey(
            value?.draftRevision === initialRevision
              ? initialDocumentKey
              : undefined,
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Couldn’t load the previous check. Run a new check to continue.",
          );
      });
    return () => controller.abort();
  }, [resumeId, format, initialRevision, initialDocumentKey]);
  const run = async () => {
    if (busy) return;
    loading.current?.abort();
    setBusy(true);
    setError("");
    try {
      const revision = await beforeRun();
      if (revision === null) return;
      const key = currentKey.current;
      const value = await requestResume(
        `/${resumeId}/analysis/${format}`,
        analysisResultSchema,
        { method: "POST", body: { expectedRevision: revision } },
      );
      setResult(value);
      setCheckedKey(key);
      setError("");
    } catch (cause) {
      if (cause instanceof ResumeRequestError && cause.status === 409)
        onConflict();
      setError(
        "Couldn’t run Resume Check. Your previous result is still available. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">Resume Check</h2>
      <p className="text-sm text-muted">
        An estimate of structure and parseability using Ogma’s checks. Choose
        the format you plan to send. A score of 90+ passes most applicable
        checks.
      </p>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Export format
        <DropdownSelect
          ariaLabel="Export format"
          disabled={busy}
          value={format}
          onValueChange={(nextFormat) => {
            setError("");
            setFormat(nextFormat === "docx" ? "docx" : "pdf");
          }}
          triggerClassName="min-h-11"
          options={[
            { value: "pdf", label: "PDF" },
            { value: "docx", label: "Word DOCX" },
          ]}
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Checking export…" : "Run Resume Check"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      {result && result.format === format && (
        <>
          <p className="text-3xl font-semibold">
            {result.score === null ? "Incomplete" : `${result.score}/100`}
          </p>
          <p role="status" className="text-sm text-muted">
            {dirty || checkedKey !== documentKey
              ? "Previous result · run again to verify the current draft."
              : "Checked current draft."}{" "}
            {result.format.toUpperCase()} · Revision {result.draftRevision} ·
            Rubric {result.rubricVersion}
          </p>
          <div className="flex flex-col gap-3">
            {[...result.checks]
              .sort(
                (a, b) =>
                  Number(b.status === "failed") - Number(a.status === "failed"),
              )
              .map((check) => (
                <article
                  key={check.id}
                  className="rounded-xl border border-line bg-canvas p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold">{check.label}</h3>
                    <span className="text-xs font-semibold capitalize">
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {check.category}
                    {check.field ? ` · ${check.field}` : ""}
                    {check.points && check.status !== "skipped"
                      ? ` · ${check.earned}/${check.points} points`
                      : ""}
                  </p>
                  {check.status === "skipped" && (
                    <p className="mt-2 text-sm text-muted">
                      Excluded from the score.
                    </p>
                  )}
                  {(check.status === "failed" ||
                    check.status === "advisory") && (
                    <p className="mt-2 text-sm">{check.fix}</p>
                  )}
                </article>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export { ResumeCheck };
