import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import { requireAuth } from "@/lib/session";

function formatDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireAuth();
  const { id } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id: Number(id) },
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {session.startedAt.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <Link href="/history" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← History
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-sm text-gray-500 space-y-1">
          <p>Start: {session.startedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
          {session.endedAt ? (
            <>
              <p>End: {session.endedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="font-medium text-gray-700">Duration: {formatDuration(session.startedAt, session.endedAt)}</p>
            </>
          ) : (
            <p className="text-amber-500 font-medium">In progress</p>
          )}
        </div>

        {session.workoutExercises.length === 0 ? (
          <p className="text-sm text-gray-400">No exercises recorded.</p>
        ) : (
          <div className="space-y-4">
            {session.workoutExercises.map((we) => (
              <div key={we.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <Link
                  href={`/progress/${we.exercise.id}`}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {we.exercise.name}
                </Link>
                {we.sets.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-2">No sets recorded.</p>
                ) : (
                  <ol className="mt-3 space-y-1.5">
                    {we.sets.map((s) => (
                      <li key={s.id} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-gray-400 w-5">{s.setNumber})</span>
                        <span>{s.weight ?? "—"}kg × {s.reps ?? "—"} reps</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <DeleteButton sessionId={session.id} />
          <Link
            href={`/workout/${session.id}`}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Edit workout →
          </Link>
        </div>
      </div>
    </div>
  );
}
