import React, { createContext, useContext } from 'react';

export const UserContext = createContext<{ id: string | null } | null>(null);

export function UserProvider({ children, id }: { children: React.ReactNode; id: string | null }) {
  return <UserContext.Provider value={{ id }}>{children}</UserContext.Provider>;
}

export function useCurrentUserId() {
  const ctx = useContext(UserContext);
  return ctx?.id ?? null;
}
