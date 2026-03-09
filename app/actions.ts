"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";

export async function startWorkout() {
  const { userId } = await requireAuth();

  const session = await prisma.workoutSession.create({
    data: { clerkUserId: userId },
  });

  redirect(`/workout/${session.id}`);
}

async function appendExerciseToSession(sessionId: number, exerciseId: number) {
  const existing = await prisma.workoutExercise.findFirst({
    where: { workoutSessionId: sessionId, exerciseId },
  });
  if (existing) return;

  const last = await prisma.workoutExercise.findFirst({
    where: { workoutSessionId: sessionId },
    orderBy: { orderIndex: "desc" },
  });
  const orderIndex = last ? last.orderIndex + 1 : 0;

  await prisma.workoutExercise.create({
    data: { workoutSessionId: sessionId, exerciseId, orderIndex },
  });
}

export async function addExerciseById(sessionId: number, exerciseId: number) {
  const { userId } = await requireAuth();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session || session.clerkUserId !== userId) return;

  await appendExerciseToSession(sessionId, exerciseId);
  redirect(`/workout/${sessionId}`);
}

export async function createAndAddExercise(sessionId: number, name: string) {
  const { userId } = await requireAuth();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session || session.clerkUserId !== userId) return;

  const trimmed = name.trim();
  if (!trimmed) return;

  let exercise = await prisma.exercise.findUnique({ where: { name: trimmed } });
  if (!exercise) {
    exercise = await prisma.exercise.create({
      data: { name: trimmed, isCustom: true },
    });
  }

  await appendExerciseToSession(sessionId, exercise.id);
  redirect(`/workout/${sessionId}`);
}

export async function saveExerciseSets(
  workoutExerciseId: number,
  sets: { setNumber: number; weight: number | null; reps: number | null }[]
): Promise<void> {
  const { userId } = await requireAuth();

  const we = await prisma.workoutExercise.findUnique({
    where: { id: workoutExerciseId },
    include: { session: { select: { clerkUserId: true } } },
  });
  if (!we || we.session.clerkUserId !== userId) return;

  await prisma.setEntry.deleteMany({ where: { workoutExerciseId } });
  await Promise.all(
    sets.map((s) =>
      prisma.setEntry.create({
        data: { workoutExerciseId, setNumber: s.setNumber, weight: s.weight, reps: s.reps },
      })
    )
  );
}

export async function endWorkout(sessionId: number): Promise<void> {
  const { userId } = await requireAuth();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session || session.clerkUserId !== userId) return;

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
  redirect("/");
}

export async function createTemplate(formData: FormData): Promise<void> {
  const { userId } = await requireAuth();
  const trimmed = (formData.get("name") as string ?? "").trim();
  if (!trimmed) return;

  const template = await prisma.workoutTemplate.create({
    data: { clerkUserId: userId, name: trimmed },
  });
  redirect(`/templates/${template.id}`);
}

export async function addExerciseToTemplate(templateId: number, exerciseId: number): Promise<void> {
  const { userId } = await requireAuth();
  const template = await prisma.workoutTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.clerkUserId !== userId) return;

  const existing = await prisma.templateExercise.findFirst({
    where: { templateId, exerciseId },
  });
  if (existing) { redirect(`/templates/${templateId}`); return; }

  const last = await prisma.templateExercise.findFirst({
    where: { templateId },
    orderBy: { orderIndex: "desc" },
  });
  const orderIndex = last ? last.orderIndex + 1 : 0;

  await prisma.templateExercise.create({
    data: { templateId, exerciseId, orderIndex },
  });
  redirect(`/templates/${templateId}`);
}

export async function createAndAddExerciseToTemplate(templateId: number, name: string): Promise<void> {
  const { userId } = await requireAuth();
  const template = await prisma.workoutTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.clerkUserId !== userId) return;

  const trimmed = name.trim();
  if (!trimmed) return;

  let exercise = await prisma.exercise.findUnique({ where: { name: trimmed } });
  if (!exercise) {
    exercise = await prisma.exercise.create({ data: { name: trimmed, isCustom: true } });
  }

  await addExerciseToTemplate(templateId, exercise.id);
}

export async function removeExerciseFromTemplate(templateExerciseId: number, templateId: number): Promise<void> {
  const { userId } = await requireAuth();
  const te = await prisma.templateExercise.findUnique({
    where: { id: templateExerciseId },
    include: { template: { select: { clerkUserId: true } } },
  });
  if (!te || te.template.clerkUserId !== userId) return;

  await prisma.templateExercise.delete({ where: { id: templateExerciseId } });
  redirect(`/templates/${templateId}`);
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const { userId } = await requireAuth();
  const template = await prisma.workoutTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.clerkUserId !== userId) return;

  await prisma.workoutTemplate.delete({ where: { id: templateId } });
  redirect("/templates");
}

export async function startWorkoutFromTemplate(templateId: number): Promise<void> {
  const { userId } = await requireAuth();
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
    include: { exercises: { orderBy: { orderIndex: "asc" } } },
  });
  if (!template || template.clerkUserId !== userId) return;

  const session = await prisma.workoutSession.create({
    data: { clerkUserId: userId },
  });

  await Promise.all(
    template.exercises.map((te, idx) =>
      prisma.workoutExercise.create({
        data: { workoutSessionId: session.id, exerciseId: te.exerciseId, orderIndex: idx },
      })
    )
  );

  redirect(`/workout/${session.id}`);
}

export async function deleteWorkout(sessionId: number): Promise<void> {
  const { userId } = await requireAuth();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session || session.clerkUserId !== userId) return;

  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { workoutSessionId: sessionId },
    select: { id: true },
  });
  const weIds = workoutExercises.map((we) => we.id);

  await prisma.setEntry.deleteMany({ where: { workoutExerciseId: { in: weIds } } });
  await prisma.workoutExercise.deleteMany({ where: { workoutSessionId: sessionId } });
  await prisma.workoutSession.delete({ where: { id: sessionId } });

  redirect("/history");
}
