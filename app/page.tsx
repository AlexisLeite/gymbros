"use client";

import { observer } from "mobx-react-lite";
import { routinesStore } from "@/src/routinesHandler";
import { ExerciseName, Routine, RoutineItem } from "@/src/routinesService";
import { useEffect, useMemo, useState } from "react";


type LastWeights = Record<ExerciseName, number>;

// localStorage keys
const LS_ROUTINES = "gim.routines.v1";
const LS_LAST_WEIGHTS = "gim.lastWeights.v1"; // legacy local cache (optional)

function Home() {
  const [lastWeights, setLastWeights] = useState<LastWeights>({});

  // UI state
  const [routineName, setRoutineName] = useState("");
  const [draftItems, setDraftItems] = useState<RoutineItem[]>([]);
  const [useRoutineId, setUseRoutineId] = useState<string | null>(null);
  const [editRoutineId, setEditRoutineId] = useState<string | null>(null);

  // Load last weights from store; fall back to legacy localStorage on first paint
  useEffect(() => {
    // from store
    setLastWeights(routinesStore.lastWeights);
    // optional legacy hydration
    try {
      const lw = JSON.parse(localStorage.getItem(LS_LAST_WEIGHTS) || "{}");
      if (lw && typeof lw === "object" && Object.keys(routinesStore.lastWeights).length === 0) {
        setLastWeights(lw);
      }
    } catch { }
  }, [routinesStore.lastWeights]);

  // Persist legacy cache (optional)
  useEffect(() => {
    if (Object.keys(lastWeights).length) {
      localStorage.setItem(LS_LAST_WEIGHTS, JSON.stringify(lastWeights));
    }
  }, [lastWeights]);

  const sortedRoutines = useMemo(
    () =>
      [...routinesStore.routines].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [routinesStore.routines]
  );

  // Derived known exercise names for suggestions
  const knownAll = useMemo(() => {
    const s = new Set<string>();
    for (const r of routinesStore.routines) for (const it of r.items) s.add(it.exercise.trim());
    for (const k of Object.keys(lastWeights)) s.add(k.trim());
    for (const it of draftItems) s.add(it.exercise.trim());
    s.delete("");
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [routinesStore.routines, lastWeights, draftItems]);

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
    await routinesStore.createRoutine({ name, createdAt, items: cleanItems });
    clearDraft();
  };

  const deleteRoutine = async (id: string) => {
    await routinesStore.removeRoutine(id);
  };

  const startUsingRoutine = (id: string) => setUseRoutineId(id);
  const stopUsingRoutine = () => setUseRoutineId(null);

  const routineInUse = useMemo(
    () => routinesStore.routines.find((r) => r.id === useRoutineId) || null,
    [useRoutineId, routinesStore.routines]
  );
  const routineBeingEdited = useMemo(
    () => routinesStore.routines.find((r) => r.id === editRoutineId) || null,
    [editRoutineId, routinesStore.routines]
  );

  const saveUsage = async (weights: Record<string, number>) => {
    // update in store and local state
    await routinesStore.persistLastWeights(weights);
    setLastWeights((prev) => ({ ...prev, ...weights }));
    stopUsingRoutine();
  };

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-8">
      <Header />

      <section className="space-y-4">
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
                known={knownAll}
                onChange={(patch) => updateDraftItem(it.id, patch)}
                onRemove={() => removeDraftItem(it.id)}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className="rounded border border-black/10 dark:border-white/20 px-3 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
              onClick={() => addDraftItem()}
            >
              + Agregar ejercicio
            </button>
            <div className="flex-1" />
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
            </button>
          </div>
        </div>
      </section>

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
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-black/70 dark:text-white/70">
                      {r.items.length} ejercicios
                    </div>
                  </div>
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
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {routineInUse && (
        <UseRoutineModal
          routine={routineInUse}
          lastWeights={lastWeights}
          onCancel={stopUsingRoutine}
          onSave={saveUsage}
        />
      )}
      {routineBeingEdited && (
        <EditRoutineModal
          routine={routineBeingEdited}
          known={knownAll}
          onCancel={() => setEditRoutineId(null)}
          onSave={async (updated) => {
            await routinesStore.updateRoutine(updated.id, { name: updated.name, items: updated.items });
            setEditRoutineId(null);
          }}
        />
      )}
    </div>
  );
}

export default observer(Home);

function Header() {
  return (
    <header className="flex items-center gap-3">
      <div className="text-2xl font-bold">Gim • Rutinas</div>
    </header>
  );
}

function DraftItemRow({
  item,
  known,
  onChange,
  onRemove,
}: {
  item: RoutineItem;
  known: string[];
  onChange: (patch: Partial<RoutineItem>) => void;
  onRemove: () => void;
}) {
  const [showSug, setShowSug] = useState(false);

  const suggestions = useMemo(() => {
    const q = item.exercise.trim().toLowerCase();
    if (!q) return known.slice(0, 5);
    return known
      .filter((k) => k.toLowerCase().includes(q))
      .slice(0, 8);
  }, [item.exercise, known]);

  return (
    <div className="grid grid-cols-12 gap-2">
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
          onClick={onRemove}
        >
          Quitar
        </button>
      </div>
    </div>
  );
}

function UseRoutineModal({
  routine,
  lastWeights,
  onCancel,
  onSave,
}: {
  routine: Routine;
  lastWeights: LastWeights;
  onCancel: () => void;
  onSave: (weights: Record<string, number>) => void;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const it of routine.items) {
      const lw = lastWeights[it.exercise];
      if (typeof lw === "number") initial[it.exercise] = lw;
    }
    return initial;
  });
  const [doneSets, setDoneSets] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const it of routine.items) initial[it.id] = 0;
    return initial;
  });

  const setWeight = (ex: string, val: number) => {
    setWeights((prev) => ({ ...prev, [ex]: val }));
  };

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-lg border border-black/10 dark:border-white/20 bg-background p-4 shadow-lg">
        <div className="mb-3">
          <div className="text-lg font-semibold">Usar rutina: {routine.name}</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          {routine.items.map((it) => (
            <div key={it.id} className="rounded border border-black/10 dark:border-white/20 p-3">
              <div className="font-medium">{it.exercise}</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {it.sets}x{it.reps} repeticiones
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
                <label className="text-sm">Último peso conocido</label>
                <div className="text-right text-sm">
                  {lastWeights[it.exercise] ?? "—"}
                </div>
                <label className="text-sm">Peso a usar</label>
                <input
                  type="number"
                  className="rounded border border-black/10 dark:border-white/20 bg-white/70 dark:bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={weights[it.exercise] ?? ""}
                  onChange={(e) => setWeight(it.exercise, Number(e.target.value || 0))}
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
              // only persist weights with positive numbers
              const clean: Record<string, number> = {};
              for (const [k, v] of Object.entries(weights)) {
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
}

function EditRoutineModal({
  routine,
  known,
  onCancel,
  onSave,
}: {
  routine: Routine;
  known: string[];
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
                known={known}
                onChange={(patch) => updateItem(it.id, patch)}
                onRemove={() => removeItem(it.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            className="rounded border border-black/10 dark:border-white/20 px-3 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
            onClick={addItem}
          >
            + Agregar ejercicio
          </button>
          <div className="flex-1" />
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
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
