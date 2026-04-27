import { useEffect, useState } from "react";

const USERS_KEY = "hoplingo-users-v1";
const CURRENT_USER_KEY = "hoplingo-current-user-v1";
const PAGELOAD_KEY = "hoplingo-pageload-id-v1";

const listeners = new Set<() => void>();
let cachedUser: string | null = null;
let initialized = false;
let pageloadId: string | null = null;

// A unique id generated for THIS page load (in-memory only).
// If sessionStorage's stored id doesn't match, the user opened the
// link freshly (new tab, reopened browser, refreshed page) and we
// must prompt for the username again.
function getPageloadId() {
  if (pageloadId) return pageloadId;
  pageloadId =
    typeof window.crypto !== "undefined" && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return pageloadId;
}

function load() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  try {
    // Drop any legacy persistent entry so it can never auto-resume.
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      /* ignore */
    }

    const pageLoadId = getPageloadId();
    const storedPageload = sessionStorage.getItem(PAGELOAD_KEY);
    if (storedPageload === pageLoadId) {
      // Same page-load (in-app navigation) — keep the active user.
      cachedUser = sessionStorage.getItem(CURRENT_USER_KEY);
    } else {
      // Fresh visit — wipe the active user so the LoginGate shows.
      sessionStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.setItem(PAGELOAD_KEY, pageLoadId);
      cachedUser = null;
    }
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getUsers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): string | null {
  load();
  return cachedUser;
}

export function normalizeUsername(name: string): string {
  return name.trim().toLowerCase();
}

export function userExists(name: string): boolean {
  const n = normalizeUsername(name);
  return getUsers().some((u) => u === n);
}

/** Sign in (or create) a user. Returns true if it was a NEW user. */
export function signInUser(name: string): { isNew: boolean; username: string } {
  const n = normalizeUsername(name);
  if (!n) throw new Error("Username required");
  const users = getUsers();
  const existed = users.includes(n);
  if (!existed) {
    users.push(n);
    saveUsers(users);
  }
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CURRENT_USER_KEY, n);
  }
  cachedUser = n;
  emit();
  return { isNew: !existed, username: n };
}

export function signOut() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  }
  cachedUser = null;
  emit();
}

export function deleteUser(name: string) {
  const n = normalizeUsername(name);
  const users = getUsers().filter((u) => u !== n);
  saveUsers(users);
  if (typeof window !== "undefined") {
    localStorage.removeItem(`hoplingo-state-v1::${n}`);
    if (cachedUser === n) {
      sessionStorage.removeItem(CURRENT_USER_KEY);
      cachedUser = null;
    }
  }
  emit();
}

export function subscribeUser(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCurrentUser(): string | null {
  load();
  const [u, setU] = useState<string | null>(cachedUser);
  useEffect(() => {
    setU(cachedUser);
    return subscribeUser(() => setU(cachedUser));
  }, []);
  return u;
}
