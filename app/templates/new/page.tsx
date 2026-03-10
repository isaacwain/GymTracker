import { createTemplate } from "@/app/actions";
import Link from "next/link";
import { requireAuth } from "@/lib/session";

export default async function NewTemplatePage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Template</h1>
          <Link href="/templates" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Templates
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form action={createTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Template name</label>
              <input
                type="text"
                name="name"
                required
                autoFocus
                placeholder="e.g. Push Day, Pull Day, Legs"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Create Template
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
