import { apiClient } from "./client";

export interface AppUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  unit?: string | null;
  role: string;
  active: boolean;
  lastLogin?: string | null;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  unit?: string;
  roleCode: string;
}

export interface UserUpdateRequest {
  fullName: string;
  email: string;
  unit?: string;
  roleCode: string;
  active: boolean;
}

export async function listUsers(): Promise<AppUser[]> {
  const { data } = await apiClient.get<AppUser[]>("/users");
  return data;
}

export async function createUser(request: UserCreateRequest): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>("/users", request);
  return data;
}

export async function updateUser(id: number, request: UserUpdateRequest): Promise<AppUser> {
  const { data } = await apiClient.put<AppUser>(`/users/${id}`, request);
  return data;
}

export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  await apiClient.put(`/users/${id}/password`, { newPassword });
}
