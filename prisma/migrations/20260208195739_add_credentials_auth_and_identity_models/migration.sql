-- CreateEnum
CREATE TYPE "UserEmailType" AS ENUM ('UNIVERSITY', 'RECOVERY');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER_WISC', 'LINK_RECOVERY', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('UNVERIFIED', 'STUDENT_VERIFIED', 'ALUMNI_VERIFIED');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "eligibilityStatus" "EligibilityStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "firstVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "lastWiscVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "loginHandle" TEXT,
  ADD COLUMN "loginHandleNormalized" TEXT,
  ADD COLUMN "requiresRecoverySetup" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "type" "UserEmailType" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "canLogin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredential" (
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "EmailOtpChallenge" (
    "id" TEXT NOT NULL,
    "emailNormalized" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptsLeft" INTEGER NOT NULL DEFAULT 5,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmail_emailNormalized_key" ON "UserEmail"("emailNormalized");

-- CreateIndex
CREATE INDEX "UserEmail_userId_idx" ON "UserEmail"("userId");

-- CreateIndex
CREATE INDEX "UserEmail_userId_type_idx" ON "UserEmail"("userId", "type");

-- CreateIndex
CREATE INDEX "EmailOtpChallenge_emailNormalized_purpose_createdAt_idx" ON "EmailOtpChallenge"("emailNormalized", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOtpChallenge_expiresAt_idx" ON "EmailOtpChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_loginHandle_key" ON "User"("loginHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_loginHandleNormalized_key" ON "User"("loginHandleNormalized");

-- AddForeignKey
ALTER TABLE "UserEmail" ADD CONSTRAINT "UserEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredential" ADD CONSTRAINT "UserCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing users as verified identities
UPDATE "User"
SET
  "eligibilityStatus" = CASE WHEN lower("email") LIKE '%@wisc.edu' THEN 'STUDENT_VERIFIED'::"EligibilityStatus" ELSE 'UNVERIFIED'::"EligibilityStatus" END,
  "firstVerifiedAt" = CASE WHEN lower("email") LIKE '%@wisc.edu' THEN COALESCE("firstVerifiedAt", "emailVerified", "createdAt") ELSE "firstVerifiedAt" END,
  "lastWiscVerifiedAt" = CASE WHEN lower("email") LIKE '%@wisc.edu' THEN COALESCE("lastWiscVerifiedAt", "emailVerified", "createdAt") ELSE "lastWiscVerifiedAt" END,
  "requiresRecoverySetup" = CASE WHEN lower("email") LIKE '%@wisc.edu' THEN true ELSE "requiresRecoverySetup" END;

INSERT INTO "UserEmail" (
  "id",
  "userId",
  "email",
  "emailNormalized",
  "type",
  "isVerified",
  "verifiedAt",
  "canLogin",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || u."id",
  u."id",
  u."email",
  lower(u."email"),
  CASE WHEN lower(u."email") LIKE '%@wisc.edu' THEN 'UNIVERSITY'::"UserEmailType" ELSE 'RECOVERY'::"UserEmailType" END,
  true,
  COALESCE(u."emailVerified", now()),
  true,
  now(),
  now()
FROM "User" u
ON CONFLICT ("emailNormalized") DO NOTHING;
