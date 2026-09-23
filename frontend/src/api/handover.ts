import { apiClient } from "./client";

export type HandoverType = "BORROW" | "RETURN";
export type HandoverStatus = "DRAFT" | "ISSUED" | "COMPLETED";

export interface HandoverItem {
  id: number;
  assetId?: number | null;
  itemName: string;
  quantity: number;
  conditionBefore?: string | null;
  conditionAfter?: string | null;
  note?: string | null;
}

export interface HandoverSlip {
  id: number;
  bookingId: number;
  bookingCode: string;
  roomName: string;
  slipNo: string;
  type: HandoverType;
  createdByName: string;
  borrowerName: string;
  borrowerUnit?: string | null;
  borrowerPhone?: string | null;
  handoverTime: string;
  note?: string | null;
  status: HandoverStatus;
  createdAt: string;
  confirmedAt?: string | null;
  confirmUrl: string;
  items: HandoverItem[];
}

export interface HandoverConfirmInfo {
  slipId: number;
  type: HandoverType;
  slipNo: string;
  roomName: string;
  bookingCode: string;
  borrowerName: string;
  alreadyConfirmed: boolean;
  confirmedAt?: string | null;
}

export interface HandoverSlipRequest {
  type: HandoverType;
  borrowerName: string;
  borrowerUnit?: string;
  borrowerPhone?: string;
  note?: string;
}

export interface HandoverItemUpdate {
  itemId: number;
  conditionAfter?: string;
  note?: string;
}

export async function createSlip(bookingId: number, request: HandoverSlipRequest): Promise<HandoverSlip> {
  const { data } = await apiClient.post<HandoverSlip>(`/bookings/${bookingId}/slips`, request);
  return data;
}

export async function listSlipsByBooking(bookingId: number): Promise<HandoverSlip[]> {
  const { data } = await apiClient.get<HandoverSlip[]>(`/bookings/${bookingId}/slips`);
  return data;
}

export async function getSlip(id: number): Promise<HandoverSlip> {
  const { data } = await apiClient.get<HandoverSlip>(`/slips/${id}`);
  return data;
}

export async function updateSlipItems(id: number, items: HandoverItemUpdate[]): Promise<HandoverSlip> {
  const { data } = await apiClient.patch<HandoverSlip>(`/slips/${id}/items`, { items });
  return data;
}

/** Fetch as a blob and open in a new tab — the endpoint requires a JWT so a plain
 * <a href> (opened via window.open with a bare URL) wouldn't carry auth.
 *
 * The blank tab is opened synchronously, before the `await`: calling window.open()
 * *after* an async fetch is no longer considered a direct response to the click that
 * triggered this function, so browsers silently block it as a popup. Opening a blank
 * tab first (still inside the synchronous part of the click handler) and redirecting
 * it once the blob is ready avoids that. */
/** Public — no JWT, called from the confirm page reached by scanning a slip's QR
 * code. Authorization is the signed `token` query param, not a login session. */
export async function getHandoverConfirmInfo(slipId: number, token: string): Promise<HandoverConfirmInfo> {
  const { data } = await apiClient.get<HandoverConfirmInfo>(`/public/handover-confirm/${slipId}`, {
    params: { token },
  });
  return data;
}

export async function confirmHandover(slipId: number, token: string): Promise<HandoverConfirmInfo> {
  const { data } = await apiClient.post<HandoverConfirmInfo>(`/public/handover-confirm/${slipId}`, null, {
    params: { token },
  });
  return data;
}

export async function openSlipPdf(id: number): Promise<void> {
  const tab = window.open("", "_blank");
  const response = await apiClient.get(`/slips/${id}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data as Blob);
  if (tab) {
    tab.location.href = url;
  } else {
    window.open(url, "_blank");
  }
}
