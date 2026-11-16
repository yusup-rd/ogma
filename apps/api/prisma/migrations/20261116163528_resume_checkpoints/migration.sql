-- CreateTable
CREATE TABLE "resume_checkpoints" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "resume_title" TEXT NOT NULL,
    "draft_revision" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "resolved" JSONB NOT NULL,
    "layout_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_checkpoint_restores" (
    "id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "draft_revision" INTEGER NOT NULL,

    CONSTRAINT "resume_checkpoint_restores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_checkpoints_resume_id_created_at_idx" ON "resume_checkpoints"("resume_id", "created_at");

-- CreateIndex
CREATE INDEX "resume_checkpoint_restores_checkpoint_id_idx" ON "resume_checkpoint_restores"("checkpoint_id");

-- AddForeignKey
ALTER TABLE "resume_checkpoints" ADD CONSTRAINT "resume_checkpoints_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_checkpoint_restores" ADD CONSTRAINT "resume_checkpoint_restores_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "resume_checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
