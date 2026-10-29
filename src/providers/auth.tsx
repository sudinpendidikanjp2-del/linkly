import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import type { AppConfigDTO, UserDTO } from "@/shared/types";
import type { LoginInput, RegisterInput } from "@/shared/schemas";

interface AuthValue {
  user: UserDTO | null;
  loading: boolean;
  config: AppConfigDTO | undefined;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserDTO | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const LAST_USER_KEY = "linkly-last-user";

function readLastUser(): UserDTO | null {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    return raw ? (JSON.parse(raw) as UserDTO) : null;
  } catch {
    return null;
  }
}

function writeLastUser(user: UserDTO | null) {
  try {
    if (user) localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, hasPassword: user.hasPassword }));
    else localStorage.removeItem(LAST_USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await api<{ user: UserDTO | null }>("/auth/me");
      writeLastUser(result.user);
      return result;
    },
    staleTime: 5 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.code === "network") && count < 1,
  });
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<AppConfigDTO>("/auth/config"),
    staleTime: 60_000,
  });

  const setUser = useCallback(
    (user: UserDTO | null) => {
      queryClient.setQueryData(["me"], { user });
      writeLastUser(user);
      if (!user) queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" && query.queryKey[0] !== "config" });
    },
    [queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => api<{ user: UserDTO }>("/auth/login", { method: "POST", body: input }),
    onSuccess: ({ user }) => setUser(user),
  });
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => api<{ user: UserDTO }>("/auth/register", { method: "POST", body: input }),
    onSuccess: ({ user }) => setUser(user),
  });
  const logoutMutation = useMutation({
    mutationFn: () => api<{ ok: true }>("/auth/logout", { method: "POST" }),
    onSettled: () => setUser(null),
  });

  const value = useMemo<AuthValue>(
    () => ({
      // Offline start: keep the app shell open for a returning user instead of bouncing them to the sign-in page.
      user: me.data?.user ?? (me.isError && me.error instanceof ApiError && me.error.code === "network" ? readLastUser() : null),
      loading: me.isPending,
      config: config.data,
      login: async (input) => void (await loginMutation.mutateAsync(input)),
      register: async (input) => void (await registerMutation.mutateAsync(input)),
      logout: async () => void (await logoutMutation.mutateAsync()),
      setUser,
    }),
    [me.data, me.isPending, config.data, loginMutation, registerMutation, logoutMutation, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

export function useUser(): UserDTO {
  const { user } = useAuth();
  if (!user) throw new Error("useUser requires a signed-in user");
  return user;
}
