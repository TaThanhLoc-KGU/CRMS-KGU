import { apiClient } from "./client";
import type { PageResponse } from "./rooms";

export interface AuditLogEntry {
  id: number;
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  detail?: string | null;
  ip?: string | null;
  createdAt: string;
}

export async function listAuditLogs(params: { entity?: string; action?: string; page?: number; size?: number } = {}) {
  const { data } = await apiClient.get<PageResponse<AuditLogEntry>>("/audit-logs", {
    params: { size: 30, ...params },
  });
  return data;
}
