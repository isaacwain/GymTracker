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
  currentPrE1rm: number;
  initialSets: {
    id: number;
    setNumber: number;
    weight: number | null;
    reps: number | null;
  }[];
};

function calcE1rm(weight: string, reps: string): number {
  const w = parseFloat(weight);
  const r = parseInt(reps);
  if (!w || !r || r <= 0) return 0;
  return w * (1 + r / 30);
}

export default function SetLogger({ workoutExerciseId, prevSummary, currentPrE1rm, initialSets }: Props) {
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
      { key: `new-${counter.current}`, setNumber: prev.length + 1, weight: "", reps: "" },
    ]);
  }

  function updateLocal(index: number, field: "weight" | "reps", value: string) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
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
        <ol className="space-y-1 mb-3">
          {sets.map((s, i) => {
            const isPR = currentPrE1rm > 0 && calcE1rm(s.weight, s.reps) > currentPrE1rm;
            return (
              <li key={s.key} className="text-sm text-gray-700 flex gap-2 items-center">
                <span className="text-gray-400 w-5">{i + 1})</span>
                <span>{s.weight || "—"}kg × {s.reps || "—"} reps</span>
                {isPR && (
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">PR</span>
                )}
              </li>
            );
          })}
        </ol>
        <button
          onClick={() => setSaved(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="mb-3 space-y-2">
          <div className="flex gap-2 text-xs text-gray-400 px-1">
            <span className="w-6">Set</span>
            <span className="w-24">Weight (kg)</span>
            <span className="w-20">Reps</span>
          </div>
          {sets.map((s, i) => {
            const isPR = currentPrE1rm > 0 && calcE1rm(s.weight, s.reps) > currentPrE1rm;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-6">{s.setNumber}</span>
                <input
                  type="number"
                  value={s.weight}
                  onChange={(e) => updateLocal(i, "weight", e.target.value)}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 w-24 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  step="0.5"
                  min="0"
                />
                <input
                  type="number"
                  value={s.reps}
                  onChange={(e) => updateLocal(i, "reps", e.target.value)}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  min="0"
                />
                {isPR && (
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">PR!</span>
                )}
                {!isPR && (
                  <button
                    onClick={() => removeRow(i)}
                    className="text-xs text-gray-300 hover:text-red-400 px-2 py-1 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={addSet}
          disabled={saving}
          className="text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors text-gray-700 font-medium"
        >
          + Add Set
        </button>
        <button
          onClick={handleSaveExercise}
          disabled={sets.length === 0 || saving}
          className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          {saving ? "Saving..." : "Save Exercise"}
        </button>
      </div>
    </div>
  );
}
