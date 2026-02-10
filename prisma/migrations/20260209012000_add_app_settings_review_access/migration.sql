CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

INSERT INTO "AppSetting" ("key", "value") VALUES
  ('requireSignInToViewReviews', 'true'),
  ('requireContributionToViewFullReviews', 'true'),
  ('fallbackReviewTitle', 'No Title, Still Helpful')
ON CONFLICT ("key") DO NOTHING;
