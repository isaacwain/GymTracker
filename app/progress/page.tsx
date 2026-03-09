import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ExerciseSearch from "./ExerciseSearch";
import ProgressChart from "./ProgressChart";
import { getExerciseProgress, type ChartDataPoint } from "@/lib/getExerciseProgress";
import { requireAuth } from "@/lib/session";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>;
}) {
  const { userId } = await requireAuth();
  const { exercise: exerciseIdStr } = await searchParams;
  const exerciseId = exerciseIdStr ? Number(exerciseIdStr) : null;

  const allExercises = await prisma.exercise.findMany({
    where: {
      workoutExercises: {
        some: {
          session: { userId, endedAt: { not: null } },
          sets: { some: { weight: { not: null } } },
        },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, muscleGroup: true },
  });

  let exercise = exerciseId
    ? allExercises.find((e) => e.id === exerciseId) ?? null
    : null;

  let chartData: ChartDataPoint[] = [];
  let sessionCount = 0;
  let bestWeight: number | null = null;
  let lastPerformed: Date | null = null;

  if (exerciseId) {
    ({ chartData, sessionCount, bestWeight, lastPerformed } =
      await getExerciseProgress(exerciseId, userId));
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Progress</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Home
        </Link>
      </div>

      <ExerciseSearch exercises={allExercises} selectedId={exerciseId} />

      {exercise && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">{exercise.name}</h2>
            <div className="grid grid-cols-3 gap-4 text-sm border rounded-lg p-4 bg-gray-50">
              <div>
                <p className="text-gray-400 mb-0.5">Last performed</p>
                <p className="font-medium">
                  {lastPerformed
                    ? lastPerformed.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Best weight</p>
                <p className="font-medium">
                  {bestWeight != null ? `${bestWeight}kg` : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Sessions</p>
                <p className="font-medium">{sessionCount}</p>
              </div>
            </div>
          </div>

          {chartData.length < 2 ? (
            <p className="text-gray-400">
              {chartData.length === 0
                ? "No completed workouts with weight data yet."
                : "Need at least 2 workouts to show a trend."}
            </p>
          ) : (
            <ProgressChart data={chartData} />
          )}
        </div>
      )}
    </main>
  );
}
