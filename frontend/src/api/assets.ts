import { apiClient } from "./client";

export const ASSET_CONDITIONS: { label: string; value: string }[] = [
  { label: "Tốt", value: "GOOD" },
  { label: "Bình thường", value: "FAIR" },
  { label: "Hư hỏng", value: "DAMAGED" },
];

export const ASSET_CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  ASSET_CONDITIONS.map((c) => [c.value, c.label]),
);

export interface Asset {
  id: number;
  roomId: number;
  assetCode: string;
  name: string;
  category?: string | null;
  quantity: number;
  unit?: string | null;
  condition: string;
  purchaseYear?: number | null;
  movable: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRequest {
  assetCode: string;
  name: string;
  category?: string | null;
  quantity?: number;
  unit?: string | null;
  condition?: string;
  purchaseYear?: number | null;
  movable?: boolean;
  note?: string | null;
}

export async function listAssetsByRoom(roomId: number): Promise<Asset[]> {
  const { data } = await apiClient.get<Asset[]>(`/rooms/${roomId}/assets`);
  return data;
}

export async function createAsset(roomId: number, request: AssetRequest): Promise<Asset> {
  const { data } = await apiClient.post<Asset>(`/rooms/${roomId}/assets`, request);
  return data;
}

export async function updateAsset(id: number, request: AssetRequest): Promise<Asset> {
  const { data } = await apiClient.put<Asset>(`/assets/${id}`, request);
  return data;
}

export async function deleteAsset(id: number): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}

export async function exportAssetsByRoom(roomId: number, roomCode: string): Promise<void> {
  const response = await apiClient.get(`/rooms/${roomId}/assets/export`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kiem-ke-${roomCode}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
