import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startWorkout } from "./actions";
import { requireAuth } from "@/lib/session";
import SignOutButton from "./SignOutButton";

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

  const [totalWorkouts, workoutsThisWeek, totalExercisesLogged, recentWorkouts, recentExercises] =
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
    ]);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gym Tracker</h1>
        <div className="flex gap-4 text-sm text-gray-500 items-center">
          <Link href="/history" className="hover:text-gray-700">History</Link>
          <Link href="/progress" className="hover:text-gray-700">Progress</Link>
          <SignOutButton />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total workouts", value: totalWorkouts },
          { label: "This week", value: workoutsThisWeek },
          { label: "Exercises logged", value: totalExercisesLogged },
        ].map(({ label, value }) => (
          <div key={label} className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Start workout */}
      <div className="border rounded-lg p-6 mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Ready to train?</h2>
          <p className="text-sm text-gray-400">Start a new workout session</p>
        </div>
        <form action={startWorkout}>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg"
          >
            Start Workout
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {/* Recent workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Workouts</h2>
            <Link href="/history" className="text-xs text-gray-400 hover:text-gray-600">
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
                    className="block border rounded-lg p-3 hover:bg-gray-50 text-sm"
                  >
                    <p className="font-medium">
                      {s.startedAt.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
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

        {/* Quick progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Exercises</h2>
            <Link href="/progress" className="text-xs text-gray-400 hover:text-gray-600">
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
                    className="block border rounded-lg p-3 hover:bg-gray-50 text-sm font-medium"
                  >
                    {we.exercise.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
