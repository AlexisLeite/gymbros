import { getAuth, User } from "firebase/auth";
import { makeAutoObservable } from "mobx";

export class SessionManager {
  user!: User

  private static _instance: SessionManager
  public static get instance() {
    if (!this._instance) {
      this._instance = new SessionManager()

      getAuth().onAuthStateChanged(state => {
        this._instance!.user = state as any
      })
    }
    return this._instance!
  }

  constructor() {
    makeAutoObservable(this)
  }
}