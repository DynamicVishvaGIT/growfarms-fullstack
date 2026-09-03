import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../api/endpoints";
import { tokenStore, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  // `booting` covers the initial token check, so the router doesn't flash the
  // login screen for an already-signed-in admin on a hard refresh.
  const [booting, setBooting] = useState(true);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  // Any 401 from any request drops the session.
  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStore.get()) {
        setBooting(false);
        return;
      }
      try {
        const { admin: me } = await auth.me();
        if (!cancelled) setAdmin(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { token, admin: me } = await auth.login(email, password);
    tokenStore.set(token);
    setAdmin(me);
    return me;
  }, []);

  const value = {
    admin,
    booting,
    signIn,
    signOut,
    setAdmin,
    isAuthenticated: Boolean(admin),
    can: (...roles) => Boolean(admin && roles.includes(admin.role)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
