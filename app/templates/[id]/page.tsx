import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import {
  removeExerciseFromTemplate,
  startWorkoutFromTemplate,
} from "@/app/actions";
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
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <Link href="/templates" className="text-sm text-gray-500 hover:text-gray-700">
          ← Templates
        </Link>
      </div>

      <TemplateExercisePicker
        templateId={templateId}
        allExercises={allExercises}
        alreadyAddedIds={alreadyAddedIds}
      />

      {template.exercises.length === 0 ? (
        <p className="text-gray-400 text-sm">No exercises yet. Add some above.</p>
      ) : (
        <ol className="space-y-2 mb-8">
          {template.exercises.map((te, i) => (
            <li
              key={te.id}
              className="flex items-center justify-between border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{te.exercise.name}</p>
                  {te.exercise.muscleGroup && (
                    <p className="text-xs text-gray-400">{te.exercise.muscleGroup}</p>
                  )}
                </div>
              </div>
              <form action={removeExerciseFromTemplate.bind(null, te.id, templateId)}>
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}

      <div className="border-t pt-6 flex items-center justify-between">
        <DeleteTemplateButton templateId={templateId} />
        <form action={startWorkoutFromTemplate.bind(null, templateId)}>
          <button
            type="submit"
            disabled={template.exercises.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2 px-5 rounded-lg text-sm"
          >
            Start Workout →
          </button>
        </form>
      </div>
    </main>
  );
}
