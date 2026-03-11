import { prisma } from "./prisma";

export type PR = {
  exerciseId: number;
  exerciseName: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: Date;
};

export async function getPRs(clerkUserId: string): Promise<PR[]> {
  const sets = await prisma.setEntry.findMany({
    where: {
      weight: { not: null },
      reps: { not: null, gt: 0 },
      workoutExercise: { session: { clerkUserId } },
    },
    select: {
      weight: true,
      reps: true,
      workoutExercise: {
        select: {
          exercise: { select: { id: true, name: true } },
          session: { select: { startedAt: true } },
        },
      },
    },
  });

  const byExercise = new Map<number, PR>();
  for (const s of sets) {
    const { weight, reps } = s;
    if (weight == null || reps == null || reps <= 0) continue;
    const e1rm = weight * (1 + reps / 30);
    const { exercise, session } = s.workoutExercise;
    const existing = byExercise.get(exercise.id);
    if (!existing || e1rm > existing.e1rm) {
      byExercise.set(exercise.id, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weight,
        reps,
        e1rm,
        date: session.startedAt,
      });
    }
  }

  return [...byExercise.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );
}

// Returns best e1rm per workoutExerciseId for the given session's exercises,
// comparing only against sets from OTHER sessions.
export async function getPRsForSession(
  clerkUserId: string,
  sessionId: number,
  exerciseIds: { workoutExerciseId: number; exerciseId: number }[]
): Promise<Record<number, number>> {
  const results = await Promise.all(
    exerciseIds.map(async ({ workoutExerciseId, exerciseId }) => {
      const sets = await prisma.setEntry.findMany({
        where: {
          weight: { not: null },
          reps: { not: null, gt: 0 },
          workoutExercise: {
            exerciseId,
            workoutSessionId: { not: sessionId },
            session: { clerkUserId },
          },
        },
        select: { weight: true, reps: true },
      });
      let bestE1rm = 0;
      for (const s of sets) {
        if (s.weight && s.reps) {
          const e1rm = s.weight * (1 + s.reps / 30);
          if (e1rm > bestE1rm) bestE1rm = e1rm;
        }
      }
      return { workoutExerciseId, bestE1rm };
    })
  );
  return Object.fromEntries(results.map((r) => [r.workoutExerciseId, r.bestE1rm]));
}
