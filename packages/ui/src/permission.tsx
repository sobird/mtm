'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { Button } from './Button';
import type { ButtonProps } from './Button';

const EMPTY_PERMISSIONS: ReadonlySet<string> = new Set();
const PermissionContext = createContext<ReadonlySet<string> | null>(null);

export interface PermissionProviderProps {
  permissions: string[];
  children: ReactNode;
}

export function PermissionProvider({ permissions, children }: PermissionProviderProps) {
  const value = useMemo(() => new Set(permissions), [permissions]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): ReadonlySet<string> {
  return useContext(PermissionContext) ?? EMPTY_PERMISSIONS;
}

export interface CanProps {
  permission: string;
  children?: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback }: CanProps) {
  const permissions = usePermissions();

  return permissions.has(permission) ? <>{children}</> : <>{fallback ?? null}</>;
}

export type PermissionButtonProps = ButtonProps & { permission: string };

export function PermissionButton({ permission, ...buttonProps }: PermissionButtonProps) {
  const permissions = usePermissions();

  if (!permissions.has(permission)) {
    return null;
  }

  return <Button {...buttonProps} />;
}
