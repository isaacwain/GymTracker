"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DayWorkout = { id: number; time: string };

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Returns offset so week starts on Monday (Mon=0 … Sun=6)
function firstDayOffset(year: number, month: number) {
  const jsDay = new Date(year, month, 1).getDay(); // Sun=0
  return (jsDay + 6) % 7;
}

export default function CalendarView({
  year,
  month,
  workoutsByDay,
  basePath = "/history/calendar",
}: {
  year: number;
  month: number;
  workoutsByDay: Record<string, DayWorkout[]>;
  basePath?: string;
}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDayOffset(year, month);
  const today = new Date();

  function navigate(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedDay(null);
    router.push(`${basePath}?month=${y}-${String(m + 1).padStart(2, "0")}`);
  }

  const selectedKey = selectedDay ? toKey(year, month, selectedDay) : null;
  const selectedWorkouts = selectedKey ? (workoutsByDay[selectedKey] ?? []) : [];

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Month nav */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ‹
          </button>
          <h2 className="font-semibold text-gray-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;

            const key = toKey(year, month, day);
            const workouts = workoutsByDay[key] ?? [];
            const hasWorkout = workouts.length > 0;
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  relative flex flex-col items-center justify-center h-10 rounded-xl text-sm font-medium transition-colors
                  ${isSelected ? "bg-indigo-600 text-white" : isToday ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"}
                `}
              >
                {day}
                {hasWorkout && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-indigo-400"}`}
                  />
                )}
                {hasWorkout && workouts.length > 1 && !isSelected && (
                  <span className="absolute top-0.5 right-1 text-[9px] font-bold text-indigo-400 leading-none">
                    {workouts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {MONTH_NAMES[month]} {selectedDay}
          </p>
          {selectedWorkouts.length === 0 ? (
            <p className="text-sm text-gray-400">No workouts on this day.</p>
          ) : (
            <ul className="space-y-2">
              {selectedWorkouts.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/history/${w.id}`}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">Workout</span>
                    <span className="text-xs text-gray-400">{w.time} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
