-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'cybersecurity',
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'beginner';
