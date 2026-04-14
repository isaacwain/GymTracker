import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProgressChart from "../ProgressChart";
import { getExerciseProgress } from "@/lib/getExerciseProgress";
import { requireAuth } from "@/lib/session";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { userId } = await requireAuth();
  const { exerciseId } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id: Number(exerciseId) },
  });

  if (!exercise) notFound();

  const { chartData } = await getExerciseProgress(exercise.id, userId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{exercise.name}</h1>
            {exercise.primaryMuscle && (
              <p className="text-sm text-gray-400 mt-0.5">{exercise.primaryMuscle}</p>
            )}
          </div>
          <Link href="/progress" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Progress
          </Link>
        </div>

        {chartData.length < 2 ? (
          <p className="text-sm text-gray-400">
            {chartData.length === 0
              ? "No completed workouts with weight data for this exercise yet."
              : "Need at least 2 workouts to show a trend."}
          </p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ProgressChart data={chartData} />
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Estimated 1RM is calculated using the Epley formula:{" "}
          <span className="font-medium text-gray-500">1RM = weight × (1 + reps / 30)</span>.
          The best result across all sets in a session is shown. This is an estimate — actual
          one-rep max may vary.
        </p>
      </div>
    </div>
  );
}
