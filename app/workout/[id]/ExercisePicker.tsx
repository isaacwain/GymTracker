"use client";

import { useState } from "react";
import { addExerciseById, createAndAddExercise } from "@/app/actions";

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string | null;
};

type Props = {
  sessionId: number;
  allExercises: Exercise[];
  alreadyAddedIds: number[];
};

export default function ExercisePicker({ sessionId, allExercises, alreadyAddedIds }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.length > 0
    ? allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasExactMatch = allExercises.some(
    (e) => e.name.toLowerCase() === query.toLowerCase()
  );

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Add Exercise</p>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors mb-2"
      />
      {filtered.length > 0 && (
        <ul className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {filtered.map((ex) => {
            const added = alreadyAddedIds.includes(ex.id);
            return (
              <li key={ex.id}>
                <button
                  disabled={added}
                  onClick={async () => { await addExerciseById(sessionId, ex.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 disabled:text-gray-300 disabled:cursor-not-allowed flex justify-between transition-colors"
                >
                  <span className="font-medium text-gray-800">{ex.name}</span>
                  <span className="text-xs text-gray-400">
                    {added ? "added" : ex.muscleGroup ?? ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {query && !hasExactMatch && (
        <button
          onClick={async () => { await createAndAddExercise(sessionId, query); }}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Create and add &ldquo;{query}&rdquo;
        </button>
      )}
    </div>
  );
}
