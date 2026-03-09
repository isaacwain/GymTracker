"use client";

import { useState } from "react";
import { addExerciseToTemplate, createAndAddExerciseToTemplate } from "@/app/actions";

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string | null;
};

type Props = {
  templateId: number;
  allExercises: Exercise[];
  alreadyAddedIds: number[];
};

export default function TemplateExercisePicker({ templateId, allExercises, alreadyAddedIds }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.length > 0
    ? allExercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasExactMatch = allExercises.some(
    (e) => e.name.toLowerCase() === query.toLowerCase()
  );

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Add Exercise
      </h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises..."
        className="border rounded-lg px-3 py-2 w-full mb-2 text-sm"
      />
      {filtered.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-52 overflow-y-auto">
          {filtered.map((ex) => {
            const added = alreadyAddedIds.includes(ex.id);
            return (
              <li key={ex.id}>
                <button
                  disabled={added}
                  onClick={async () => {
                    await addExerciseToTemplate(templateId, ex.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex justify-between"
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
            await createAndAddExerciseToTemplate(templateId, query);
          }}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Create and add &ldquo;{query}&rdquo;
        </button>
      )}
    </div>
  );
}
