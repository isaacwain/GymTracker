import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  return { userId: Number(session.user.id), email: session.user.email! };
}
