/*
  Warnings:

  - Added the required column `userId` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "Song" ADD COLUMN "userId" TEXT;

-- Set a default value for existing records
UPDATE "Song" SET "userId" = 'legacy_user';

-- Make the column required
ALTER TABLE "Song" ALTER COLUMN "userId" SET NOT NULL;
