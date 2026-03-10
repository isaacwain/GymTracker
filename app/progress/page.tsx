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
          session: { clerkUserId: userId, endedAt: { not: null } },
          sets: { some: { weight: { not: null } } },
        },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, muscleGroup: true },
  });

  let exercise = exerciseId ? allExercises.find((e) => e.id === exerciseId) ?? null : null;

  let chartData: ChartDataPoint[] = [];
  let sessionCount = 0;
  let bestWeight: number | null = null;
  let lastPerformed: Date | null = null;

  if (exerciseId) {
    ({ chartData, sessionCount, bestWeight, lastPerformed } =
      await getExerciseProgress(exerciseId, userId));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Progress</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Home
          </Link>
        </div>

        <ExerciseSearch exercises={allExercises} selectedId={exerciseId} />

        {exercise && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{exercise.name}</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  label: "Last performed",
                  value: lastPerformed
                    ? lastPerformed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                    : "—",
                },
                { label: "Best weight", value: bestWeight != null ? `${bestWeight}kg` : "—" },
                { label: "Sessions", value: String(sessionCount) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {chartData.length < 2 ? (
              <p className="text-sm text-gray-400">
                {chartData.length === 0
                  ? "No completed workouts with weight data yet."
                  : "Need at least 2 workouts to show a trend."}
              </p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <ProgressChart data={chartData} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
