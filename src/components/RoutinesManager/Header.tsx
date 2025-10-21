"use client";

import { SessionManager } from "@/src/firebase/SessionManager";

export function Header() {
  return (
    <header className="flex items-center gap-3">
      <div className="text-2xl font-bold">Gim •  {SessionManager.instance.user.displayName}</div>
    </header>
  );
}
