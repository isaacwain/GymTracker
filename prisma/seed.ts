import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  // Chest
  { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Dumbbell Bench Press", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Cable Fly", muscleGroup: "Chest", equipment: "Cable" },
  { name: "Dips", muscleGroup: "Chest", equipment: "Bodyweight" },
  // Back
  { name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight" },
  { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable" },
  { name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbell" },
  { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable" },
  { name: "Face Pull", muscleGroup: "Back", equipment: "Cable" },
  // Shoulders
  { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Rear Delt Fly", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  // Legs
  { name: "Back Squat", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Front Squat", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
  { name: "Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Leg Extension", muscleGroup: "Legs", equipment: "Machine" },
  { name: "Calf Raise", muscleGroup: "Legs", equipment: "Machine" },
  // Arms
  { name: "Barbell Curl", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Dumbbell Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbell" },
  { name: "Tricep Pushdown", muscleGroup: "Arms", equipment: "Cable" },
  { name: "Skullcrusher", muscleGroup: "Arms", equipment: "Barbell" },
  { name: "Overhead Tricep Extension", muscleGroup: "Arms", equipment: "Dumbbell" },
  // Core
  { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
  { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable" },
];

async function main() {
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: { ...ex, isCustom: false },
    });
  }
  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
