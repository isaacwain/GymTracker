"use client";

import { deleteAllHistory } from "@/app/actions";

export default function DeleteAllButton() {
  async function handleDelete() {
    if (!window.confirm("Delete all workout history? This cannot be undone.")) return;
    await deleteAllHistory();
  }

  return (
    <button
      onClick={handleDelete}
      className="w-full mt-6 py-3 rounded-2xl text-sm font-medium text-red-400 border border-red-100 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      Delete all history
    </button>
  );
}
