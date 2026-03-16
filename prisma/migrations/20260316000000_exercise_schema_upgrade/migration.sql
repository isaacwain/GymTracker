-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'LATS', 'TRAPS', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE', 'ABS');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'SMITH_MACHINE', 'EZ_BAR', 'KETTLEBELL', 'RESISTANCE_BAND');

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'SQUAT', 'HINGE', 'ISOLATION', 'CARRY', 'ROTATION');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable: drop old string columns, add new typed columns
ALTER TABLE "Exercise"
  DROP COLUMN "muscleGroup",
  DROP COLUMN "equipment",
  ADD COLUMN "primaryMuscle"    "MuscleGroup",
  ADD COLUMN "secondaryMuscles" "MuscleGroup"[] NOT NULL DEFAULT ARRAY[]::"MuscleGroup"[],
  ADD COLUMN "equipment"        "Equipment",
  ADD COLUMN "movementPattern"  "MovementPattern",
  ADD COLUMN "difficulty"       "Difficulty",
  ADD COLUMN "isCompound"       BOOLEAN,
  ADD COLUMN "exerciseFamily"   TEXT;
