import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: UserDTO | null }>("/auth/me"),
    staleTime: 5 * 60_000,
  });
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<AppConfigDTO>("/auth/config"),
    staleTime: 60_000,
  });

  const setUser = useCallback(
    (user: UserDTO | null) => {
      queryClient.setQueryData(["me"], { user });
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
      user: me.data?.user ?? null,
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
