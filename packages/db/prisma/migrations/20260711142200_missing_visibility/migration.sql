-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC', 'UNLISTED');

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "isOfficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "saved_exams" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_exams_examId_idx" ON "saved_exams"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_exams_userId_examId_key" ON "saved_exams"("userId", "examId");

-- CreateIndex
CREATE INDEX "exams_visibility_idx" ON "exams"("visibility");

-- AddForeignKey
ALTER TABLE "saved_exams" ADD CONSTRAINT "saved_exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_exams" ADD CONSTRAINT "saved_exams_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
