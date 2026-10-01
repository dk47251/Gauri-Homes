"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Permissions = {
  userId: number;
  /** Read & Write access: may create, edit and delete. */
  canWrite: boolean;
  isAdmin: boolean;
  isSystemAdmin: boolean;
};

const PermissionsContext = createContext<Permissions>({ userId: 0, canWrite: false, isAdmin: false, isSystemAdmin: false });

/**
 * Makes the logged-in user's permissions available to client components so they can hide
 * create/edit/delete controls. The server enforces the same rules on every action.
 */
export function PermissionsProvider({ value, children }: { value: Permissions; children: ReactNode }) {
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export const usePermissions = () => useContext(PermissionsContext);
