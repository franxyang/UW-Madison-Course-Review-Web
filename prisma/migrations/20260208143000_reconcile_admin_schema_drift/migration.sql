-- Reconcile live DB drift for admin moderation features.
-- Idempotent by design: safe if objects already exist.

-- 1) Ensure UserRole enum includes MODERATOR.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'UserRole'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'UserRole'
        AND e.enumlabel = 'MODERATOR'
    ) THEN
      ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';
    END IF;
  END IF;
END $$;

-- 2) AuditLog table + indexes + FK.
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- 3) UserBan table + index + FKs.
CREATE TABLE IF NOT EXISTS "UserBan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "bannedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserBan_userId_active_idx" ON "UserBan"("userId", "active");

ALTER TABLE "UserBan" DROP CONSTRAINT IF EXISTS "UserBan_userId_fkey";
ALTER TABLE "UserBan"
  ADD CONSTRAINT "UserBan_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "UserBan" DROP CONSTRAINT IF EXISTS "UserBan_bannedById_fkey";
ALTER TABLE "UserBan"
  ADD CONSTRAINT "UserBan_bannedById_fkey"
  FOREIGN KEY ("bannedById") REFERENCES "User"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- 4) Report resolution fields + index + FK.
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "resolution" TEXT;

CREATE INDEX IF NOT EXISTS "Report_resolvedById_idx" ON "Report"("resolvedById");

ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_resolvedById_fkey";
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
