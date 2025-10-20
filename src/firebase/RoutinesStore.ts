// stores/RoutinesStore.ts

import { makeAutoObservable, runInAction } from "mobx";
import {
  readAllRoutines,
  createRoutineInFirestore,
  updateRoutineInFirestore,
  deleteRoutineInFirestore,
  readLastWeights,
  saveLastWeights,
  Routine,
  LastWeights,
} from "./routinesService"; // Asegúrate de que la ruta sea correcta
import { getAuth } from 'firebase/auth';

export class RoutinesStore {
  routines: Routine[] = [];
  loading: boolean = false;
  error: string | null = null;
  lastWeights: LastWeights = {};

  updateLastWeight(name: string, howMuch: number) {
    this.lastWeights[name] = howMuch
  }

  public static instance = new RoutinesStore()

  constructor() {
    makeAutoObservable(this);

    this.loadRoutines();
    this.loadLastWeights();

    getAuth().onAuthStateChanged(state => {
      if (state) {
        this.loadRoutines()
        this.loadLastWeights()
      }
    })
  }

  // Cargar rutinas (ya la tenías)
  async loadRoutines() {
    this.loading = true;
    this.error = null;
    try {
      const fetchedRoutines = await readAllRoutines();
      runInAction(() => {
        this.routines = fetchedRoutines;
        this.loading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al cargar las rutinas.";
        this.loading = false;
      });
    }
  }

  // NUEVOS MÉTODOS EN EL STORE:

  // Método para crear una rutina
  async createRoutine(newRoutineData: Omit<Routine, 'id'>) {
    this.loading = true;
    this.error = null;
    try {
      const createdRoutine = await createRoutineInFirestore(newRoutineData);
      runInAction(() => {
        this.routines.push(createdRoutine); // Añadir la rutina recién creada al store
        this.loading = false;
      });
      return createdRoutine;
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al crear la rutina.";
        this.loading = false;
      });
      throw e; // Relanza el error para que la UI pueda manejarlo si es necesario
    }
  }

  // Método para actualizar una rutina
  async updateRoutine(routineId: string, updatedFields: Partial<Omit<Routine, 'id' | 'createdAt'>>) {
    this.loading = true; // Podrías tener un loading más granular si solo quieres mostrar el spinner para el elemento editado
    this.error = null;
    try {
      await updateRoutineInFirestore(routineId, updatedFields);
      runInAction(() => {
        const index = this.routines.findIndex(r => r.id === routineId);
        if (index !== -1) {
          // Actualiza solo los campos que han cambiado
          this.routines[index] = { ...this.routines[index], ...updatedFields };
        }
        this.loading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al actualizar la rutina.";
        this.loading = false;
      });
      throw e;
    }
  }

  // Método para eliminar una rutina
  async removeRoutine(routineId: string) {
    this.loading = true; // Podrías tener un loading más granular
    this.error = null;
    try {
      await deleteRoutineInFirestore(routineId);
      runInAction(() => {
        // Filtra la rutina eliminada del array observable
        this.routines = this.routines.filter(r => r.id !== routineId);
        this.loading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al eliminar la rutina.";
        this.loading = false;
      });
      throw e;
    }
  }

  // Cargar últimos pesos conocidos
  async loadLastWeights() {
    try {
      const data = await readLastWeights();
      runInAction(() => {
        this.lastWeights = data || {};
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al cargar los últimos pesos.";
      });
    }
  }

  // Guardar/mezclar últimos pesos conocidos
  async persistLastWeights(patch: LastWeights) {
    try {
      await saveLastWeights(patch);
      runInAction(() => {
        this.lastWeights = { ...this.lastWeights, ...patch };
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Error al guardar los últimos pesos.";
      });
      throw e;
    }
  }
}

export const routinesStore = new RoutinesStore();
