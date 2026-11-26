-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "draft_revision" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "rubric_version" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_runs_resume_id_created_at_idx" ON "analysis_runs"("resume_id", "created_at");

-- AddForeignKey
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
