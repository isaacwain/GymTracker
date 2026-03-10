import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { removeExerciseFromTemplate, startWorkoutFromTemplate } from "@/app/actions";
import TemplateExercisePicker from "./TemplateExercisePicker";
import DeleteTemplateButton from "./DeleteTemplateButton";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const templateId = Number(id);

  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
    include: {
      exercises: {
        orderBy: { orderIndex: "asc" },
        include: { exercise: true },
      },
    },
  });

  if (!template || template.clerkUserId !== userId) notFound();

  const allExercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, muscleGroup: true },
  });

  const alreadyAddedIds = template.exercises.map((te) => te.exerciseId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{template.name}</h1>
          <Link href="/templates" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Templates
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <TemplateExercisePicker
            templateId={templateId}
            allExercises={allExercises}
            alreadyAddedIds={alreadyAddedIds}
          />
        </div>

        {template.exercises.length === 0 ? (
          <p className="text-sm text-gray-400 mb-8">No exercises yet. Add some above.</p>
        ) : (
          <ol className="space-y-2 mb-6">
            {template.exercises.map((te, i) => (
              <li
                key={te.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-5 font-medium">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{te.exercise.name}</p>
                    {te.exercise.muscleGroup && (
                      <p className="text-xs text-gray-400">{te.exercise.muscleGroup}</p>
                    )}
                  </div>
                </div>
                <form action={removeExerciseFromTemplate.bind(null, te.id, templateId)}>
                  <button type="submit" className="text-xs text-gray-300 hover:text-red-400 px-2 py-1 transition-colors">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}

        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <DeleteTemplateButton templateId={templateId} />
          <form action={startWorkoutFromTemplate.bind(null, templateId)}>
            <button
              type="submit"
              disabled={template.exercises.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
            >
              Start Workout →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
