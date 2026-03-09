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
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {session.startedAt.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h1>
        <Link href="/history" className="text-sm text-gray-500 hover:text-gray-700">
          ← History
        </Link>
      </div>

      <div className="text-sm text-gray-500 mb-8 space-y-1">
        <p>
          Start:{" "}
          {session.startedAt.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {session.endedAt ? (
          <>
            <p>
              End:{" "}
              {session.endedAt.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>Duration: {formatDuration(session.startedAt, session.endedAt)}</p>
          </>
        ) : (
          <p className="text-yellow-500">In progress</p>
        )}
      </div>

      {session.workoutExercises.length === 0 ? (
        <p className="text-gray-400">No exercises recorded.</p>
      ) : (
        <div className="space-y-6">
          {session.workoutExercises.map((we) => (
            <div key={we.id}>
              <Link
                href={`/progress/${we.exercise.id}`}
                className="font-semibold text-lg hover:text-blue-600"
              >
                {we.exercise.name}
              </Link>
              {we.sets.length === 0 ? (
                <p className="text-sm text-gray-400 mt-1">No sets recorded.</p>
              ) : (
                <ol className="space-y-1 mt-1">
                  {we.sets.map((s) => (
                    <li key={s.id} className="text-sm text-gray-700">
                      {s.setNumber}) {s.weight ?? "—"}kg × {s.reps ?? "—"}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 pt-6 border-t flex items-center justify-between">
        <DeleteButton sessionId={session.id} />
        <Link
          href={`/workout/${session.id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Edit workout →
        </Link>
      </div>
    </main>
  );
}
