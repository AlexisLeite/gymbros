"use client";

import { useMemo, useState } from "react";
import { RoutineItem } from "@/src/firebase/routinesService";
import { RoutinesStore } from "@/src/firebase/RoutinesStore";

export function DraftItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: RoutineItem;
  onChange: (patch: Partial<RoutineItem>) => void;
  onRemove: () => void;
}) {
  const [showSug, setShowSug] = useState(false);

  const suggestions = useMemo(() => {
    const q = item.exercise.trim().toLowerCase();
    if (!q) return RoutinesStore.instance.knownExercises.slice(0, 5);

    return RoutinesStore.instance.knownExercises
      .filter((k) => k.toLowerCase().includes(q))
      .slice(0, 8);
  }, [item.exercise]);

  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
      <div className="col-span-6 relative">
        <input
          className="w-full rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ejercicio"
          value={item.exercise}
          onChange={(e) => onChange({ exercise: e.target.value })}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
        />
        {showSug && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-black/10 dark:border-white/20 bg-white dark:bg-black/90 text-sm shadow">
            {suggestions.map((s) => (
              <button
                key={s}
                className="block w-full text-left px-3 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange({ exercise: s });
                  setShowSug(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="number"
        min={1}
        className="col-span-2 rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Series"
        value={item.sets}
        onChange={(e) => onChange({ sets: Math.max(1, Number(e.target.value || 0)) })}
      />
      <input
        type="number"
        min={1}
        className="col-span-2 rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Reps"
        value={item.reps}
        onChange={(e) => onChange({ reps: Math.max(1, Number(e.target.value || 0)) })}
      />
      <div className="col-span-2 flex items-center justify-end">
        <button
          className="rounded px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
          onClick={() => {
            if (confirm('Segur@ de eliminar el ejercicio?')) { onRemove() }
          }}
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
