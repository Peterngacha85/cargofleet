import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  return { user, isAuthenticated, setSession, logout, role: user?.role };
};
