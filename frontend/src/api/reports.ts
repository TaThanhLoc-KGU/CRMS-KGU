import { apiClient } from "./client";

export interface RoomUsage {
  roomId: number;
  roomCode: string;
  roomName: string;
  bookingCount: number;
  totalHours: number;
}

export interface UnitStats {
  unit: string;
  totalRequests: number;
  approved: number;
  rejected: number;
  approvalRatePercent: number;
}

export interface ReportSummary {
  roomUsage: RoomUsage[];
  unitStats: UnitStats[];
  avgProcessingHours: number | null;
  totalBookings: number;
  totalApproved: number;
  totalRejected: number;
  totalCancelled: number;
}

export async function getUsageReport(from: string, to: string): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>("/reports/usage", { params: { from, to } });
  return data;
}

export async function downloadUsageReportExcel(from: string, to: string): Promise<void> {
  const response = await apiClient.get("/reports/usage/export", {
    params: { from, to },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bao-cao-su-dung-phong.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
