import { useEffect, useMemo, useState } from "react";
import api, { getApiError } from "../lib/api";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      setUser(data.user);
      return data.user;
    },
    async register(details) {
      const { data } = await api.post("/auth/register", details);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      await api.post("/auth/logout");
      setUser(null);
    },
    getApiError,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
