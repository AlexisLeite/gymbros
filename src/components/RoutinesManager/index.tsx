"use client";

import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { routinesStore } from "@/src/firebase/RoutinesStore";
import { SessionManager } from "@/src/firebase/SessionManager";
// RoutinesStore is not directly used here
import { Header } from "./Header";
import { UseRoutineModal } from "./UseRoutineModal";
import { EditRoutineModal } from "./EditRoutineModal";
import { NewRoutine } from "./NewRoutine";

export const RoutinesManager = observer(() => {
  if (!SessionManager.instance.user) {
    throw new Error("Failed login");
  }

  // UI state
  const [useRoutineId, setUseRoutineId] = useState<string | null>(null);
  const [editRoutineId, setEditRoutineId] = useState<string | null>(null);

  const sortedRoutines = [...routinesStore.routines].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const deleteRoutine = async (id: string) => {
    await routinesStore.removeRoutine(id);
  };

  const startUsingRoutine = (id: string) => setUseRoutineId(id);
  const stopUsingRoutine = () => setUseRoutineId(null);

  const routineInUse = useMemo(
    () => routinesStore.routines.find((r) => r.id === useRoutineId) || null,
    [useRoutineId]
  );
  const routineBeingEdited = useMemo(
    () => routinesStore.routines.find((r) => r.id === editRoutineId) || null,
    [editRoutineId]
  );

  const saveUsage = async (weights: Record<string, number>) => {
    await routinesStore.persistLastWeights(weights);
    stopUsingRoutine();
  };

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-8">
      <Header />

      <NewRoutine />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Rutinas</h2>
        {routinesStore.loading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Cargando rutinas…</p>
        ) : sortedRoutines.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            No hay rutinas aún. Crea una arriba.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedRoutines.map((r) => (
              <li
                key={r.id}
                className="rounded border border-black/10 dark:border-white/20 p-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-black/70 dark:text-white/70">
                      {r.items.length} ejercicios
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded px-3 py-2 border border-black/10 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
                      onClick={() => setEditRoutineId(r.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded px-3 py-2 border border-black/10 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
                      onClick={() => startUsingRoutine(r.id)}
                    >
                      Usar
                    </button>
                    <button
                      className="rounded px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                      onClick={() => deleteRoutine(r.id)}
                      title="Eliminar rutina"
                    >
                      Eliminar
                    </button></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {routineInUse && (
        <UseRoutineModal
          routine={routineInUse}
          onCancel={stopUsingRoutine}
          onSave={saveUsage}
        />
      )}
      {routineBeingEdited && (
        <EditRoutineModal
          routine={routineBeingEdited}
          onCancel={() => setEditRoutineId(null)}
          onSave={async (updated) => {
            await routinesStore.updateRoutine(updated.id, { name: updated.name, items: updated.items });
            setEditRoutineId(null);
          }}
        />
      )}
    </div>
  );
});

export default RoutinesManager;
