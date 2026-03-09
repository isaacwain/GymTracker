import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAuth } from "@/lib/session";

function formatDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function HistoryPage() {
  const { userId } = await requireAuth();

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: {
      _count: { select: { workoutExercises: true } },
    },
  });

  return (
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Workout History</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Home
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-400">No workouts yet. Start your first one!</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/history/${s.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {s.startedAt.toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {s.startedAt.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {s.endedAt && (
                        <>
                          {" → "}
                          {s.endedAt.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {formatDuration(s.startedAt, s.endedAt)}
                        </>
                      )}
                      {!s.endedAt && (
                        <span className="ml-2 text-yellow-500 text-xs">In progress</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {s._count.workoutExercises}{" "}
                    {s._count.workoutExercises === 1 ? "exercise" : "exercises"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
