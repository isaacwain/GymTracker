import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const routines = await prisma.routine.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { templates: true } },
    },
  });

  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const description = (body.description as string | undefined)?.trim() || null;
  const templateIds: number[] = Array.isArray(body.templateIds) ? body.templateIds : [];

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (templateIds.length === 0)
    return NextResponse.json({ error: "Select at least one template" }, { status: 400 });

  // Verify all templates belong to this user
  const templates = await prisma.workoutTemplate.findMany({
    where: { id: { in: templateIds }, clerkUserId: userId },
    select: { id: true },
  });

  if (templates.length !== templateIds.length) {
    return NextResponse.json({ error: "Invalid template selection" }, { status: 400 });
  }

  const routine = await prisma.routine.create({
    data: {
      clerkUserId: userId,
      name,
      description,
      templates: {
        create: templateIds.map((templateId, idx) => ({
          templateId,
          orderIndex: idx,
        })),
      },
    },
    include: {
      templates: {
        orderBy: { orderIndex: "asc" },
        include: { template: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(routine, { status: 201 });
}
