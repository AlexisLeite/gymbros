"use client";

import { useState } from "react";
import { Routine, RoutineItem } from "@/src/firebase/routinesService";
import { DraftItemRow } from "./DraftItemRow";

export function EditRoutineModal({
  routine,
  onCancel,
  onSave,
}: {
  routine: Routine;
  onCancel: () => void;
  onSave: (r: Routine) => void;
}) {
  const [name, setName] = useState(routine.name);
  const [items, setItems] = useState<RoutineItem[]>(() =>
    routine.items.map((i) => ({ ...i }))
  );

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), exercise: "", sets: 3, reps: 10 },
    ]);
  };
  const updateItem = (id: string, patch: Partial<RoutineItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const save = () => {
    const nm = name.trim();
    if (!nm) return;
    const cleanItems = items
      .map((it) => ({ ...it, exercise: it.exercise.trim() }))
      .filter((it) => it.exercise && it.sets > 0 && it.reps > 0);
    if (cleanItems.length === 0) return;
    onSave({ ...routine, name: nm, items: cleanItems });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-black/10 dark:border-white/20 bg-background p-4 shadow-lg">
        <div className="mb-3">
          <div className="text-lg font-semibold">Editar rutina</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            Creada: {new Date(routine.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          <input
            className="w-full rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la rutina"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {items.length === 0 && (
            <p className="text-sm text-black/60 dark:text-white/60">
              Agrega ejercicios a esta rutina.
            </p>
          )}

          <div className="space-y-3">
            {items.map((it) => (
              <DraftItemRow
                key={it.id}
                item={it}
                onChange={(patch) => updateItem(it.id, patch)}
                onRemove={() => removeItem(it.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            className="rounded border border-black/10 dark:border-white/20 px-3 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
            onClick={addItem}
          >
            + Agregar ejercicio
          </button>
          <div className="flex-1" />
          <div className="flex items-start gap-2">
            <button
              className="rounded px-4 py-2 border border-black/10 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className="rounded bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              onClick={save}
              disabled={!name.trim() || items.length === 0}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
