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
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          {exercise.muscleGroup && (
            <p className="text-sm text-gray-400">{exercise.muscleGroup}</p>
          )}
        </div>
        <Link href="/progress" className="text-sm text-gray-500 hover:text-gray-700">
          ← Progress
        </Link>
      </div>

      {chartData.length < 2 ? (
        <p className="text-gray-400">
          {chartData.length === 0
            ? "No completed workouts with weight data for this exercise yet."
            : "Need at least 2 workouts to show a trend."}
        </p>
      ) : (
        <ProgressChart data={chartData} />
      )}
    </main>
  );
}
