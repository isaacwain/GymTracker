import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import CalendarView from "./CalendarView";

export default async function CalendarPage({
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
    if (!isNaN(y) && !isNaN(m)) {
      year = y;
      monthIdx = m - 1;
    }
  }

  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      clerkUserId: userId,
      endedAt: { not: null },
      startedAt: { gte: start, lte: end },
    },
    select: { id: true, startedAt: true },
    orderBy: { startedAt: "asc" },
  });

  const workoutsByDay: Record<string, { id: number; time: string }[]> = {};
  for (const s of sessions) {
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Calendar</h1>
          <Link href="/history" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← History
          </Link>
        </div>
        <CalendarView year={year} month={monthIdx} workoutsByDay={workoutsByDay} />
      </div>
    </div>
  );
}
