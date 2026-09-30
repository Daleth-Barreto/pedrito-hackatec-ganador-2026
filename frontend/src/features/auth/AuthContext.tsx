import { t, useLocale } from "../../i18n/runtime";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, errorMessage } from "../../services/api";
import type { User } from "../../types";
interface AuthState {
  user: User | null;
  loading: boolean;
  expired: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => void;
  updateUser: (user: User) => void;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<User>("/auth/me")
      .then((value) => {
        if (active) setUser(value);
      })
      .catch((err) => {
        if (active && !(err instanceof ApiError && err.status === 401))
          setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  useEffect(() => {
    const onExpired = () => {
      if (user) {
        setExpired(true);
        setUser(null);
      }
    };
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, [user]);
  async function login(email: string, password: string) {
    const result = await api<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(result);
    setExpired(false);
    setError("");
  }
  async function logout() {
    await api<void>("/auth/logout", { method: "POST" });
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        expired,
        error,
        login,
        logout,
        updateUser: setUser,
        reload: () => setVersion((v) => v + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error(t("AuthContext.authprovider_requerido"));
  return auth;
}
