import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import CalendarView from "./calendar/CalendarView";

function formatDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await requireAuth();
  const { month } = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let monthIdx = now.getMonth();

  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m)) { year = y; monthIdx = m - 1; }
  }

  const calStart = new Date(year, monthIdx, 1);
  const calEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

  const [calendarSessions, allSessions] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { clerkUserId: userId, endedAt: { not: null }, startedAt: { gte: calStart, lte: calEnd } },
      select: { id: true, startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: { clerkUserId: userId },
      orderBy: { startedAt: "desc" },
      include: { _count: { select: { workoutExercises: true } } },
    }),
  ]);

  const workoutsByDay: Record<string, { id: number; time: string }[]> = {};
  for (const s of calendarSessions) {
    const key = `${s.startedAt.getFullYear()}-${String(s.startedAt.getMonth() + 1).padStart(2, "0")}-${String(s.startedAt.getDate()).padStart(2, "0")}`;
    if (!workoutsByDay[key]) workoutsByDay[key] = [];
    workoutsByDay[key].push({
      id: s.id,
      time: s.startedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">History</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Home
          </Link>
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <CalendarView
            year={year}
            month={monthIdx}
            workoutsByDay={workoutsByDay}
            basePath="/history"
          />
        </div>

        {/* Full list */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">All Workouts</p>
        {allSessions.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts yet. Start your first one!</p>
        ) : (
          <ul className="space-y-3">
            {allSessions.map((s) => (
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
                        {s.startedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        {s.endedAt && (
                          <> · {formatDuration(s.startedAt, s.endedAt)}</>
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
