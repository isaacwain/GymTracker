"use client";

import { deleteWorkout } from "@/app/actions";

export default function DeleteButton({ sessionId }: { sessionId: number }) {
  async function handleDelete() {
    if (!window.confirm("Delete this workout? This cannot be undone.")) return;
    await deleteWorkout(sessionId);
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-400 hover:text-red-600"
    >
      Delete workout
    </button>
  );
}
