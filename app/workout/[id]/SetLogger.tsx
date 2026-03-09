"use client";

import { useState, useRef } from "react";
import { saveExerciseSets } from "@/app/actions";

type SetRow = {
  key: string;
  setNumber: number;
  weight: string;
  reps: string;
};

type Props = {
  workoutExerciseId: number;
  prevSummary: string | null;
  initialSets: {
    id: number;
    setNumber: number;
    weight: number | null;
    reps: number | null;
  }[];
};

export default function SetLogger({ workoutExerciseId, prevSummary, initialSets }: Props) {
  const counter = useRef(initialSets.length);

  const [saved, setSaved] = useState(initialSets.length > 0);
  const [saving, setSaving] = useState(false);

  const [sets, setSets] = useState<SetRow[]>(() =>
    initialSets.map((s) => ({
      key: `s${s.id}`,
      setNumber: s.setNumber,
      weight: s.weight != null ? String(s.weight) : "",
      reps: s.reps != null ? String(s.reps) : "",
    }))
  );

  function addSet() {
    counter.current += 1;
    setSets((prev) => [
      ...prev,
      {
        key: `new-${counter.current}`,
        setNumber: prev.length + 1,
        weight: "",
        reps: "",
      },
    ]);
  }

  function updateLocal(index: number, field: "weight" | "reps", value: string) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeRow(index: number) {
    setSets((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((row, i) => ({ ...row, setNumber: i + 1 }));
    });
  }

  async function handleSaveExercise() {
    setSaving(true);
    try {
      await saveExerciseSets(
        workoutExerciseId,
        sets.map((s, i) => ({
          setNumber: i + 1,
          weight: s.weight !== "" ? Number(s.weight) : null,
          reps: s.reps !== "" ? Number(s.reps) : null,
        }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div>
        {prevSummary && (
          <p className="text-xs text-gray-400 mb-2">Last time: {prevSummary}</p>
        )}
        <ol className="space-y-1 mb-2">
          {sets.map((s, i) => (
            <li key={s.key} className="text-sm text-gray-700">
              {i + 1}) {s.weight || "—"}kg × {s.reps || "—"}
            </li>
          ))}
        </ol>
        <button
          onClick={() => setSaved(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      {prevSummary && (
        <p className="text-xs text-gray-400 mb-3">Last time: {prevSummary}</p>
      )}
      {sets.length === 0 && (
        <p className="text-sm text-gray-400 mb-3">No sets added yet</p>
      )}
      {sets.length > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex gap-2 text-xs text-gray-500 mb-1 px-1">
            <span className="w-6">Set</span>
            <span className="w-24">Weight (kg)</span>
            <span className="w-20">Reps</span>
          </div>
          {sets.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-6">{s.setNumber}</span>
              <input
                type="number"
                value={s.weight}
                onChange={(e) => updateLocal(i, "weight", e.target.value)}
                placeholder="0"
                className="border rounded px-2 py-1 w-24 text-sm"
                step="0.5"
                min="0"
              />
              <input
                type="number"
                value={s.reps}
                onChange={(e) => updateLocal(i, "reps", e.target.value)}
                placeholder="0"
                className="border rounded px-2 py-1 w-20 text-sm"
                min="0"
              />
              <button
                onClick={() => removeRow(i)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={addSet}
          disabled={saving}
          className="text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-40 px-3 py-1.5 rounded-lg"
        >
          + Add Set
        </button>
        <button
          onClick={handleSaveExercise}
          disabled={sets.length === 0 || saving}
          className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg"
        >
          {saving ? "Saving..." : "Save Exercise"}
        </button>
      </div>
    </div>
  );
}
