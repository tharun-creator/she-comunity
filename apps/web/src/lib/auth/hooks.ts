import { useAuth as useAuthContext } from "./context";

export function useAuth() {
  return useAuthContext();
}

export function useUser() {
  const { user } = useAuthContext();
  return user;
}

export function useProfile() {
  const { profile } = useAuthContext();
  return profile;
}

export function useAuthLoading() {
  const { loading } = useAuthContext();
  return loading;
}