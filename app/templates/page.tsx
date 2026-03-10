import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { startWorkoutFromTemplate } from "@/app/actions";

export default async function TemplatesPage() {
  const { userId } = await requireAuth();

  const templates = await prisma.workoutTemplate.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { exercises: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Templates</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Home
          </Link>
        </div>

        <Link
          href="/templates/new"
          className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-5 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors mb-6"
        >
          + New Template
        </Link>

        {templates.length === 0 ? (
          <p className="text-sm text-gray-400">No templates yet. Create one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {templates.map((t) => (
              <li key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t._count.exercises} {t._count.exercises === 1 ? "exercise" : "exercises"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/templates/${t.id}`}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <form action={startWorkoutFromTemplate.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
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
    </div>
  );
}
