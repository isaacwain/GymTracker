"use client";

import { useState, useEffect, useRef } from "react";

const PRESETS = [30, 60, 90];

export default function RestTimer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  function start(seconds: number) {
    setTimeLeft(seconds);
    setIsRunning(true);
    setIsOpen(true);
  }

  function pause() { setIsRunning(false); }
  function resume() { if (timeLeft > 0) setIsRunning(true); }
  function reset() { setIsRunning(false); setTimeLeft(0); }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, "0")}`
    : `${secs}s`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rest Timer</p>
          {isRunning && (
            <span className="text-sm font-bold text-indigo-600 tabular-nums">{display}</span>
          )}
          {!isRunning && timeLeft > 0 && (
            <span className="text-sm font-bold text-gray-400 tabular-nums">{display} paused</span>
          )}
        </div>
        <span className="text-gray-300 text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {/* Countdown */}
          {timeLeft > 0 && (
            <div className="py-4 text-center">
              <p className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">{display}</p>
            </div>
          )}

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => start(s)}
                className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {s}s
              </button>
            ))}
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Custom
            </button>
          </div>

          {/* Custom input */}
          {showCustom && (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="seconds"
                min="1"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              />
              <button
                onClick={() => {
                  const s = parseInt(customInput);
                  if (s > 0) { start(s); setShowCustom(false); setCustomInput(""); }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-sm font-semibold transition-colors"
              >
                Start
              </button>
            </div>
          )}

          {/* Controls */}
          {timeLeft > 0 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={isRunning ? pause : resume}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                {isRunning ? "Pause" : "Resume"}
              </button>
              <button
                onClick={reset}
                className="border border-gray-200 hover:bg-gray-50 rounded-xl px-5 py-3 text-sm font-medium text-gray-500 transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
