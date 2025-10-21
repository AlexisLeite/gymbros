"use client";

import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Routine } from "@/src/firebase/routinesService";
import { RoutinesStore } from "@/src/firebase/RoutinesStore";

export const UseRoutineModal = observer(({
  routine,
  onCancel,
  onSave,
}: {
  routine: Routine;
  onCancel: () => void;
  onSave: (weights: Record<string, number>) => void;
}) => {
  const [doneSets, setDoneSets] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const it of routine.items) initial[it.id] = 0;
    return initial;
  });

  const incSet = (itemId: string, max: number) => {
    setDoneSets((prev) => {
      const cur = prev[itemId] ?? 0;
      return { ...prev, [itemId]: Math.min(max, cur + 1) };
    });
  };
  const decSet = (itemId: string) => {
    setDoneSets((prev) => {
      const cur = prev[itemId] ?? 0;
      return { ...prev, [itemId]: Math.max(0, cur - 1) };
    });
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 `}>
      <div className="w-full max-w-xl rounded-lg border border-black/10 dark:border-white/20 bg-background p-4 shadow-lg">
        <div className="mb-3">
          <div className="text-lg font-semibold">Usar rutina: {routine.name}</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          {routine.items.map((it) => (
            <div key={it.id} className={`rounded border border-black/10 dark:border-white/20 p-3 ${doneSets[it.id] === it.sets ? 'disable-content' : ''}`}>
              <div className="font-medium">{it.sets}x{it.reps} {it.exercise}</div>
              <div className="text-xs text-black/60 dark:text-white/60">

              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm">Series completadas:</span>
                <button
                  className="rounded border px-2 py-1 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.08]"
                  onClick={() => decSet(it.id)}
                >
                  −
                </button>
                <span className="min-w-10 text-center text-sm font-medium">
                  {doneSets[it.id] ?? 0} / {it.sets}
                </span>
                <button
                  className="rounded border px-2 py-1 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.08] disabled:opacity-50"
                  onClick={() => incSet(it.id, it.sets)}
                  disabled={(doneSets[it.id] ?? 0) >= it.sets}
                >
                  +
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 items-center">
                <label className="text-sm">Peso a usar</label>
                <input
                  type="number"
                  className="rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={RoutinesStore.instance.lastWeights[it.exercise] ?? ""}
                  onChange={(e) => RoutinesStore.instance.updateLastWeight(it.exercise, Number(e.target.value || 0))}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded px-4 py-2 border border-black/10 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="rounded bg-green-600 text-white px-4 py-2 hover:bg-green-700"
            onClick={() => {
              const clean: Record<string, number> = {};
              for (const [k, v] of Object.entries(RoutinesStore.instance.lastWeights)) {
                if (typeof v === "number" && v > 0) clean[k] = v;
              }
              onSave(clean);
            }}
          >
            Guardar sesión
          </button>
        </div>
      </div>
    </div>
  );
});
