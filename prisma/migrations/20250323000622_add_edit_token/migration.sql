/*
  Warnings:

  - A unique constraint covering the columns `[editToken]` on the table `Song` will be added. If there are existing duplicate values, this will fail.
  - The required column `editToken` was added to the `Song` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- Add editToken column as nullable first
ALTER TABLE "Song" ADD COLUMN "editToken" TEXT;

-- Generate unique tokens for existing records
UPDATE "Song" SET "editToken" = gen_random_uuid()::text WHERE "editToken" IS NULL;

-- Make the column required and unique
ALTER TABLE "Song" ALTER COLUMN "editToken" SET NOT NULL;
CREATE UNIQUE INDEX "Song_editToken_key" ON "Song"("editToken");
