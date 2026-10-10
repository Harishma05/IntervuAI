import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((current) => active && setUser(current)).catch(() => active && setUser(null)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) { const current = await loginAccount(credentials); setUser(current); return current; },
    async register(account) { const current = await registerAccount(account); setUser(current); return current; },
    async logout() { await logoutAccount(); setUser(null); },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
