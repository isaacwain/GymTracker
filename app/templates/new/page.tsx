import { createTemplate } from "@/app/actions";
import Link from "next/link";
import { requireAuth } from "@/lib/session";

export default async function NewTemplatePage() {
  await requireAuth();

  return (
    <main className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">New Template</h1>
        <Link href="/templates" className="text-sm text-gray-500 hover:text-gray-700">
          ← Templates
        </Link>
      </div>

      <form action={createTemplate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template name</label>
          <input
            type="text"
            name="name"
            required
            autoFocus
            placeholder="e.g. Push Day, Pull Day, Legs"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm"
        >
          Create Template
        </button>
      </form>
    </main>
  );
}
