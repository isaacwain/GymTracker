"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Exercise = { id: number; name: string; muscleGroup: string | null };

export default function ExerciseSearch({
  exercises,
  selectedId,
}: {
  exercises: Exercise[];
  selectedId: number | null;
}) {
  const router = useRouter();
  const selected = exercises.find((e) => e.id === selectedId);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(!selectedId);

  const filtered =
    query.length > 0
      ? exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
      : exercises;

  function select(ex: Exercise) {
    setQuery(ex.name);
    setOpen(false);
    router.push(`/progress?exercise=${ex.id}`);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search exercises..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-md divide-y divide-gray-50">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <button
                onClick={() => select(ex)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex justify-between text-sm transition-colors"
              >
                <span className="font-medium text-gray-800">{ex.name}</span>
                <span className="text-gray-400 text-xs">{ex.muscleGroup ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
