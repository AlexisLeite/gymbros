// firebase/routinesService.ts

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./db"; // Asegúrate de haber inicializado Firebase

// Asumiendo que 'Routine' es tu tipo definido, incluyendo 'id' para los datos que vienen de Firestore
export type ExerciseName = string;

export type RoutineItem = {
  id: string;
  exercise: ExerciseName;
  sets: number;
  reps: number;
};

export type Routine = {
  id: string; // El ID del documento de Firestore
  name: string;
  createdAt: string; // ISO
  items: RoutineItem[];
};
export type LastWeights = Record<ExerciseName, number>;

// Función para leer todas las rutinas (ya la tenías)
export async function readAllRoutines(): Promise<Routine[]> {
  const routines: Routine[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, "routines"));

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      routines.push({
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt,
        items: data.items
      } as Routine);
    });
    return routines;
  } catch (e) {
    console.error("Error al leer rutinas: ", e);
    throw e; // Relanza el error para que el store pueda manejarlo
  }
}

// NUEVAS FUNCIONES PARA CRUD:

// Función para crear una nueva rutina en Firestore
// 'Omit<Routine, 'id'>' significa que la rutina que pasamos no necesita tener un 'id'
// porque Firestore lo generará.
export async function createRoutineInFirestore(
  routineData: Omit<Routine, 'id'>
): Promise<Routine> {
  try {
    const docRef = await addDoc(collection(db, "routines"), routineData);
    // Retorna la rutina completa con el ID generado por Firestore
    return { id: docRef.id, ...routineData };
  } catch (e) {
    console.error("Error al crear rutina: ", e);
    throw e;
  }
}

// Función para actualizar una rutina existente en Firestore
// 'Partial<Routine>' significa que solo pasamos los campos que queremos actualizar
export async function updateRoutineInFirestore(
  routineId: string,
  updatedFields: Partial<Routine>
): Promise<void> {
  try {
    const routineRef = doc(db, "routines", routineId);
    await updateDoc(routineRef, updatedFields);
  } catch (e) {
    console.error("Error al actualizar rutina: ", e);
    throw e;
  }
}

// Función para eliminar una rutina de Firestore
export async function deleteRoutineInFirestore(routineId: string): Promise<void> {
  try {
    const routineRef = doc(db, "routines", routineId);
    await deleteDoc(routineRef);
  } catch (e) {
    console.error("Error al eliminar rutina: ", e);
    throw e;
  }
}

// ===== Pesos (últimos pesos conocidos) =====

const LAST_WEIGHTS_DOC = () => doc(db, "meta", "lastWeights");

export async function readLastWeights(): Promise<LastWeights> {
  try {
    const snap = await getDoc(LAST_WEIGHTS_DOC());
    if (!snap.exists()) return {};
    const data = snap.data() as { weights?: Record<string, number> };
    return (data.weights || {}) as LastWeights;
  } catch (e) {
    console.error("Error al leer últimos pesos: ", e);
    throw e;
  }
}

export async function saveLastWeights(patch: LastWeights): Promise<void> {
  try {
    await setDoc(LAST_WEIGHTS_DOC(), { weights: patch }, { merge: true });
  } catch (e) {
    console.error("Error al guardar últimos pesos: ", e);
    throw e;
  }
}
