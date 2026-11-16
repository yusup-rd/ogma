-- CreateTable
CREATE TABLE "owner_sessions" (
    "token_hash" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "owner_sessions_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "sign_in_attempts" (
    "token_hash" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "code_verifier" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sign_in_attempts_pkey" PRIMARY KEY ("token_hash")
);

-- CreateIndex
CREATE INDEX "owner_sessions_expires_at_idx" ON "owner_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "owner_sessions_owner_id_idx" ON "owner_sessions"("owner_id");

-- CreateIndex
CREATE INDEX "sign_in_attempts_expires_at_idx" ON "sign_in_attempts"("expires_at");

-- AddForeignKey
ALTER TABLE "owner_sessions" ADD CONSTRAINT "owner_sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
