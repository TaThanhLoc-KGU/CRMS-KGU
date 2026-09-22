import { apiClient } from "./client";

export type RoomStatus = "ACTIVE" | "MAINTENANCE" | "DISABLED";

export interface RoomImage {
  id: number;
  url: string;
  caption?: string | null;
  sortOrder: number;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  building?: string | null;
  floor?: number | null;
  capacity?: number | null;
  areaM2?: number | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: RoomStatus;
  minLeadHoursOverride?: number | null;
  images: RoomImage[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomRequest {
  code: string;
  name: string;
  building?: string | null;
  floor?: number | null;
  capacity?: number | null;
  areaM2?: number | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  status?: RoomStatus;
  minLeadHoursOverride?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RoomListParams {
  floor?: number;
  status?: RoomStatus;
  minCapacity?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export async function listRooms(params: RoomListParams = {}): Promise<PageResponse<Room>> {
  const { data } = await apiClient.get<PageResponse<Room>>("/rooms", {
    params: { size: 50, ...params },
  });
  return data;
}

export async function getRoom(id: number): Promise<Room> {
  const { data } = await apiClient.get<Room>(`/rooms/${id}`);
  return data;
}

export async function createRoom(request: RoomRequest): Promise<Room> {
  const { data } = await apiClient.post<Room>("/rooms", request);
  return data;
}

export async function updateRoom(id: number, request: RoomRequest): Promise<Room> {
  const { data } = await apiClient.put<Room>(`/rooms/${id}`, request);
  return data;
}

export async function deleteRoom(id: number): Promise<void> {
  await apiClient.delete(`/rooms/${id}`);
}
