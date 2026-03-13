import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startWorkout } from "./actions";
import { requireAuth } from "@/lib/session";
import SignOutButton from "./SignOutButton";
import { startWorkoutFromTemplate } from "./actions";

function formatDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function Home() {
  const { userId } = await requireAuth();

  const now = new Date();
  const daysFromMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysFromMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalWorkouts, workoutsThisWeek, totalExercisesLogged, recentWorkouts, recentExercises, templates] =
    await Promise.all([
      prisma.workoutSession.count({ where: { clerkUserId: userId, endedAt: { not: null } } }),
      prisma.workoutSession.count({
        where: { clerkUserId: userId, endedAt: { not: null }, startedAt: { gte: startOfWeek } },
      }),
      prisma.workoutExercise.count({ where: { session: { clerkUserId: userId } } }),
      prisma.workoutSession.findMany({
        where: { clerkUserId: userId, endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { _count: { select: { workoutExercises: true } } },
      }),
      prisma.workoutExercise.findMany({
        where: { session: { clerkUserId: userId } },
        distinct: ["exerciseId"],
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { exercise: { select: { id: true, name: true } } },
      }),
      prisma.workoutTemplate.findMany({
        where: { clerkUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { exercises: true } } },
      }),
    ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gym Tracker</h1>
            <SignOutButton />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-3 flex-wrap">
            <Link href="/history" className="hover:text-gray-900 transition-colors">History</Link>
            <Link href="/progress" className="hover:text-gray-900 transition-colors">Progress</Link>
            <Link href="/prs" className="hover:text-gray-900 transition-colors">PRs</Link>
            <Link href="/templates" className="hover:text-gray-900 transition-colors">Templates</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total workouts", value: totalWorkouts },
            { label: "This week", value: workoutsThisWeek },
            { label: "Exercises logged", value: totalExercisesLogged },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Start workout */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Ready to train?</h2>
            <p className="text-sm text-gray-400 mt-0.5">Start a new workout session</p>
          </div>
          <form action={startWorkout}>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              Start Workout
            </button>
          </form>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Templates</p>
            <Link href="/templates" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              View all
            </Link>
          </div>
          {templates.length === 0 ? (
            <Link
              href="/templates/new"
              className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-5 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
              + Create your first template
            </Link>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t._count.exercises} {t._count.exercises === 1 ? "exercise" : "exercises"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/templates/${t.id}`}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={startWorkoutFromTemplate.bind(null, t.id)}>
                      <button
                        type="submit"
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Start →
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Recent workouts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Workouts</p>
              <Link href="/history" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                View all
              </Link>
            </div>
            {recentWorkouts.length === 0 ? (
              <p className="text-sm text-gray-400">No completed workouts yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentWorkouts.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/history/${s.id}`}
                      className="block bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {s.startedAt.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.endedAt && formatDuration(s.startedAt, s.endedAt)}
                        {" · "}
                        {s._count.workoutExercises}{" "}
                        {s._count.workoutExercises === 1 ? "exercise" : "exercises"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Exercises</p>
              <Link href="/progress" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                View all
              </Link>
            </div>
            {recentExercises.length === 0 ? (
              <p className="text-sm text-gray-400">No exercises logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentExercises.map((we) => (
                  <li key={we.exercise.id}>
                    <Link
                      href={`/progress?exercise=${we.exercise.id}`}
                      className="block bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md transition-shadow text-sm font-medium text-gray-900"
                    >
                      {we.exercise.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
