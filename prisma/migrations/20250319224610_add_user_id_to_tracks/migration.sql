/*
  Warnings:

  - Added the required column `userId` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "Track" ADD COLUMN "userId" TEXT;

-- Copy userId from parent songs for existing tracks
UPDATE "Track" t
SET "userId" = s."userId"
FROM "Song" s
WHERE t."songId" = s."id";

-- Make the column required
ALTER TABLE "Track" ALTER COLUMN "userId" SET NOT NULL;
