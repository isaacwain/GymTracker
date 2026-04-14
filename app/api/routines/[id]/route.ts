import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const routineId = Number(id);
  if (isNaN(routineId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      templates: {
        orderBy: { orderIndex: "asc" },
        include: {
          template: {
            include: {
              exercises: {
                orderBy: { orderIndex: "asc" },
                include: { exercise: true },
              },
            },
          },
        },
      },
    },
  });

  if (!routine || routine.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(routine);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const routineId = Number(id);
  if (isNaN(routineId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const routine = await prisma.routine.findUnique({ where: { id: routineId } });
  if (!routine || routine.clerkUserId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.routine.delete({ where: { id: routineId } });
  return NextResponse.json({ ok: true });
}
