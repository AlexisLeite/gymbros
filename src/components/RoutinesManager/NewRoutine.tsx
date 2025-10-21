import { DraftItemRow } from '@/src/components/RoutinesManager/DraftItemRow';

import { routinesStore } from '@/src/firebase/RoutinesStore';
import { SessionManager } from '@/src/firebase/SessionManager';
import { RoutineItem } from '@/src/firebase/routinesService';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

export const NewRoutine = observer(() => {
  const [routineName, setRoutineName] = useState("");
  const [draftItems, setDraftItems] = useState<RoutineItem[]>([]);


  const addDraftItem = (item?: Partial<RoutineItem>) => {
    const id = crypto.randomUUID();
    setDraftItems((prev) => [
      ...prev,
      {
        id,
        exercise: item?.exercise ?? "",
        sets: item?.sets ?? 3,
        reps: item?.reps ?? 10,
      },
    ]);
  };

  const updateDraftItem = (id: string, patch: Partial<RoutineItem>) => {
    setDraftItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeDraftItem = (id: string) => {
    setDraftItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearDraft = () => {
    setRoutineName("");
    setDraftItems([]);
  };
  const saveRoutine = async () => {
    const name = routineName.trim();
    if (!name) return;
    const cleanItems = draftItems
      .map((it) => ({ ...it, exercise: it.exercise.trim() }))
      .filter((it) => it.exercise && it.sets > 0 && it.reps > 0);
    if (cleanItems.length === 0) return;
    const createdAt = new Date().toISOString();
    await routinesStore.createRoutine({ name, createdAt, items: cleanItems, owner: SessionManager.instance.user!.uid });
    clearDraft();
  };

  return <section className="space-y-4">
    <h2 className="text-xl font-semibold">Crear rutina</h2>
    <div className="flex flex-col gap-3">
      <input
        className="rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nombre de la rutina (p. ej., Pecho/Lunes)"
        value={routineName}
        onChange={(e) => setRoutineName(e.target.value)}
      />

      <div className="space-y-3">
        {draftItems.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">
            Agrega ejercicios a la rutina con el botón de abajo.
          </p>
        )}

        {draftItems.map((it) => (
          <DraftItemRow
            key={it.id}
            item={it}
            onChange={(patch) => updateDraftItem(it.id, patch)}
            onRemove={() => removeDraftItem(it.id)}
          />
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          className="rounded border border-black/10 dark:border-white/20 px-3 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
          onClick={() => addDraftItem()}
        >
          + Agregar ejercicio
        </button>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button
            className="rounded px-4 py-2 border border-black/10 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
            onClick={clearDraft}
            disabled={!routineName && draftItems.length === 0}
          >
            Limpiar
          </button>
          <button
            className="rounded bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50"
            onClick={saveRoutine}
            disabled={!routineName.trim() || draftItems.length === 0}
          >
            Guardar rutina
          </button></div>
      </div>
    </div>
  </section>
})