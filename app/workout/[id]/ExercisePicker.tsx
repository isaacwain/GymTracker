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
    ? allExercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const hasExactMatch = allExercises.some(
    (e) => e.name.toLowerCase() === query.toLowerCase()
  );

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">Add Exercise</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises..."
        className="border rounded-lg px-3 py-2 w-full mb-2"
      />
      {filtered.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {filtered.map((ex) => {
            const added = alreadyAddedIds.includes(ex.id);
            return (
              <li key={ex.id}>
                <button
                  disabled={added}
                  onClick={async () => {
                    await addExerciseById(sessionId, ex.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex justify-between"
                >
                  <span>{ex.name}</span>
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
          onClick={async () => {
            await createAndAddExercise(sessionId, query);
          }}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Create and add &ldquo;{query}&rdquo;
        </button>
      )}
    </div>
  );
}
