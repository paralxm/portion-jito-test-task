import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

/**
 * The exit guard (ledger §12 D3/D4): a focused screen with meaningful unsaved data
 * registers a handler that, when asked, opens its own Discard changes? confirmation and
 * returns `true`; a clean screen returns `false` and is left at once. The app consults the
 * visible step's guard for browser Back and gesture exits, and warns before an unload
 * while any guard reports a dirty draft. Platform limits: a refresh or tab closure only
 * gets the browser's generic prompt; native swipe-back is whatever the browser maps to
 * history navigation.
 */
export type ExitGuard = () => boolean;

interface Registry {
  register: (guard: ExitGuard | null, dirty: boolean) => void;
}

const ExitGuardContext = createContext<Registry | null>(null);

export interface GuardEntry {
  guard: ExitGuard;
  dirty: boolean;
}

/** Wraps one focused step so its screen can register a guard under that step's id. */
export function ExitGuardScope({ id, guards, children }: { id: number; guards: Map<number, GuardEntry>; children: ReactNode }) {
  const registry = useRef<Registry>({
    register: (guard, dirty) => {
      if (guard === null) guards.delete(id);
      else guards.set(id, { guard, dirty });
    },
  });
  useEffect(() => () => void guards.delete(id), [guards, id]);
  return <ExitGuardContext.Provider value={registry.current}>{children}</ExitGuardContext.Provider>;
}

/** A screen calls this with its current guard and dirtiness; outside a scope (stories) it is a no-op. */
export function useExitGuard(guard: ExitGuard, dirty: boolean): void {
  const registry = useContext(ExitGuardContext);
  const latest = useRef(guard);
  latest.current = guard;
  useEffect(() => {
    if (!registry) return;
    registry.register(() => latest.current(), dirty);
    return () => registry.register(null, false);
  }, [registry, dirty]);
}
