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
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Home
        </Link>
      </div>

      <Link
        href="/templates/new"
        className="block w-full text-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 mb-6"
      >
        + New Template
      </Link>

      {templates.length === 0 ? (
        <p className="text-gray-400 text-sm">No templates yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t._count.exercises} {t._count.exercises === 1 ? "exercise" : "exercises"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/templates/${t.id}`}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border rounded-lg"
                >
                  Edit
                </Link>
                <form action={startWorkoutFromTemplate.bind(null, t.id)}>
                  <button
                    type="submit"
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
                  >
                    Start →
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
