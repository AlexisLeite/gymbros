'use client'

import LoginComponent from "@/src/components/LoginComponent"
import { RoutinesManager } from "@/src/components/RoutinesManager"
import { SessionManager } from "@/src/firebase/SessionManager"
import { observer } from "mobx-react-lite"

function Home() {
  if (!SessionManager.instance.user) {
    return <LoginComponent />
  }

  return <RoutinesManager />
}

export default observer(Home)