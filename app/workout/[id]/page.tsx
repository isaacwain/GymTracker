import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExercisePicker from "./ExercisePicker";
import SetLogger from "./SetLogger";
import RestTimer from "./RestTimer";
import { endWorkout } from "@/app/actions";
import { requireAuth } from "@/lib/session";
import { getPRsForSession } from "@/lib/getPRs";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const sessionId = Number(id);

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      workoutExercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session || session.clerkUserId !== userId) notFound();

  const allExercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, muscleGroup: true },
  });

  const alreadyAddedIds = session.workoutExercises.map((we) => we.exerciseId);

  const previousPerformance = await Promise.all(
    session.workoutExercises.map(async (we) => {
      const prev = await prisma.workoutExercise.findFirst({
        where: {
          exerciseId: we.exerciseId,
          workoutSessionId: { not: sessionId },
          session: { clerkUserId: userId },
          sets: { some: { weight: { not: null } } },
        },
        orderBy: { session: { startedAt: "desc" } },
        include: { sets: { orderBy: { setNumber: "asc" } } },
      });
      return { workoutExerciseId: we.id, sets: prev?.sets ?? [] };
    })
  );
  const prevPerfMap = Object.fromEntries(
    previousPerformance.map((p) => [p.workoutExerciseId, p.sets])
  );

  const prMap = await getPRsForSession(
    userId,
    sessionId,
    session.workoutExercises.map((we) => ({ workoutExerciseId: we.id, exerciseId: we.exerciseId }))
  );

  const isCompleted = !!session.endedAt;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {isCompleted
              ? session.startedAt.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Workout in progress"}
          </h1>
          {isCompleted && (
            <Link href={`/history/${sessionId}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← History
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-8">
          {session.startedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </p>

        <ExercisePicker
          sessionId={sessionId}
          allExercises={allExercises}
          alreadyAddedIds={alreadyAddedIds}
        />

        {session.workoutExercises.length === 0 ? (
          <p className="text-sm text-gray-400">No exercises added yet</p>
        ) : (
          <div className="space-y-4">
            {session.workoutExercises.map((we) => {
              const prevSets = prevPerfMap[we.id] ?? [];
              const filledSets = prevSets.filter((s) => s.weight != null);
              const prevSummary =
                filledSets.length > 0
                  ? filledSets.map((s) => `${s.weight}kg × ${s.reps ?? "—"}`).join(", ")
                  : null;

              return (
                <div key={we.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{we.exercise.name}</h3>
                  <SetLogger
                    workoutExerciseId={we.id}
                    prevSummary={prevSummary}
                    initialSets={we.sets}
                    currentPrE1rm={prMap[we.id] ?? 0}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!isCompleted && <RestTimer />}

        {!isCompleted && (
          <form action={endWorkout.bind(null, sessionId)} className="mt-2">
            <button
              type="submit"
              className="w-full border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              End Workout
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
