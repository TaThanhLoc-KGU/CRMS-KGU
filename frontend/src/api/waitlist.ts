import { apiClient } from "./client";

export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CANCELLED";

export interface WaitlistEntry {
  id: number;
  roomId: number;
  roomCode: string;
  roomName: string;
  startTime: string;
  endTime: string;
  requesterUnit: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  expectedAttendees?: number | null;
  purpose?: string | null;
  status: WaitlistStatus;
  createdAt: string;
  notifiedAt?: string | null;
}

export async function listWaitlist(params: { roomId?: number; status?: WaitlistStatus } = {}): Promise<WaitlistEntry[]> {
  const { data } = await apiClient.get<WaitlistEntry[]>("/waitlist", { params });
  return data;
}

export async function cancelWaitlistEntry(id: number): Promise<WaitlistEntry> {
  const { data } = await apiClient.post<WaitlistEntry>(`/waitlist/${id}/cancel`, {});
  return data;
}
