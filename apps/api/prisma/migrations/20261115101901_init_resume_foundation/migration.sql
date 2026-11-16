-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL,
    "identity_issuer" TEXT NOT NULL,
    "identity_subject" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "draft_revision" INTEGER NOT NULL DEFAULT 1,
    "document" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_identity_issuer_identity_subject_key" ON "owners"("identity_issuer", "identity_subject");

-- CreateIndex
CREATE INDEX "resumes_owner_id_archived_at_updated_at_idx" ON "resumes"("owner_id", "archived_at", "updated_at");

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
