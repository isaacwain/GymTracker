import { prisma } from "./prisma";

export type ChartDataPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  estimated1RM: number;
};

export type ExerciseProgressResult = {
  chartData: ChartDataPoint[];
  sessionCount: number;
  bestWeight: number | null;
  lastPerformed: Date | null;
};

export async function getExerciseProgress(
  exerciseId: number,
  clerkUserId: string
): Promise<ExerciseProgressResult> {
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: {
      exerciseId,
      session: { clerkUserId, endedAt: { not: null } },
    },
    orderBy: { session: { startedAt: "asc" } },
    include: {
      session: { select: { startedAt: true } },
      sets: true,
    },
  });

  const withData = workoutExercises.filter((we) =>
    we.sets.some((s) => s.weight != null)
  );

  const chartData: ChartDataPoint[] = withData.map((we) => {
    const weights = we.sets.map((s) => s.weight ?? 0);
    const maxWeight = Math.max(...weights);
    const totalVolume = we.sets.reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
      0
    );
    const estimated1RM = Math.max(
      ...we.sets
        .filter((s) => s.weight != null && s.reps != null && s.reps > 0)
        .map((s) => Math.round(s.weight! * (1 + s.reps! / 30)))
    );
    return {
      date: we.session.startedAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      maxWeight,
      totalVolume,
      estimated1RM,
    };
  });

  const sessionCount = withData.length;
  const bestWeight =
    sessionCount > 0 ? Math.max(...chartData.map((d) => d.maxWeight)) : null;
  const lastPerformed =
    sessionCount > 0
      ? withData[withData.length - 1].session.startedAt
      : null;

  return { chartData, sessionCount, bestWeight, lastPerformed };
}
