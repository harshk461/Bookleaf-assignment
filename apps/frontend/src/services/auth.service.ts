import type { AuthResponse } from "@bookleaf/shared";
import { API_PATHS } from "@bookleaf/shared";
import { api } from "./api";

export async function login(email: string, password: string) {
  return api<AuthResponse>(API_PATHS.auth.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return api<AuthResponse["user"]>(API_PATHS.auth.me);
}
