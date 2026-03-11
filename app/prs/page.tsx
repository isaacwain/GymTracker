import { requireAuth } from "@/lib/session";
import { getPRs } from "@/lib/getPRs";
import Link from "next/link";

export default async function PRsPage() {
  const { userId } = await requireAuth();
  const prs = await getPRs(userId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Personal Records</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Home
          </Link>
        </div>

        {prs.length === 0 ? (
          <p className="text-sm text-gray-400">No records yet. Log some sets to see your PRs here.</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              Best estimated 1RM per exercise. e1RM = weight × (1 + reps / 30).
            </p>
            <ul className="space-y-3">
              {prs.map((pr) => (
                <li key={pr.exerciseId}>
                  <Link
                    href={`/progress?exercise=${pr.exerciseId}`}
                    className="block bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{pr.exerciseName}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {pr.weight}kg × {pr.reps} reps
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">
                          {Math.round(pr.e1rm)}kg e1RM
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {pr.date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
