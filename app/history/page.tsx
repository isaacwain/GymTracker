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
    where: { clerkUserId: userId },
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { workoutExercises: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">History</h1>
          <div className="flex items-center gap-4">
            <Link href="/history/calendar" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Calendar
            </Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Home
            </Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts yet. Start your first one!</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/history/${s.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {s.startedAt.toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
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
                          <span className="ml-2 text-amber-500 text-xs font-medium">In progress</span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400 mt-0.5">
                      {s._count.workoutExercises}{" "}
                      {s._count.workoutExercises === 1 ? "exercise" : "exercises"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
