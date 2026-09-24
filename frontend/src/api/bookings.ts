import { apiClient } from "./client";
import type { PageResponse } from "./rooms";
import type { WaitlistEntry } from "./waitlist";

export type BookingStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "SLIP_ISSUED"
  | "IN_USE"
  | "RETURNED"
  | "CLOSED";

export interface BookingEquipmentItem {
  equipmentId: number;
  quantity?: number;
  note?: string;
}

export interface BookingSubmitData {
  roomId: number;
  setupStyleId?: number | null;
  requesterUnit: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  startTime: string;
  endTime: string;
  expectedAttendees?: number;
  purpose?: string;
  extraRequirements?: string;
  equipmentItems?: BookingEquipmentItem[];
  agreeToTerms: boolean;
  /** Recurring bookings: number of weekly occurrences (1 or undefined = one-off). */
  repeatWeeks?: number;
}

export interface BookingAttachment {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface BookingEquipmentDto {
  id: number;
  equipmentId: number;
  equipmentName: string;
  quantity: number;
  note?: string | null;
}

export interface ApprovalDto {
  id: number;
  level: number;
  approverName: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string | null;
  decidedAt: string;
}

export interface Booking {
  id: number;
  code: string;
  roomId: number;
  roomCode: string;
  roomName: string;
  setupStyleId?: number | null;
  setupStyleName?: string | null;
  requesterUnit: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  startTime: string;
  endTime: string;
  expectedAttendees?: number | null;
  purpose?: string | null;
  extraRequirements?: string | null;
  status: BookingStatus;
  submittedAt: string;
  decidedAt?: string | null;
  cancelReason?: string | null;
  source: "PUBLIC" | "INTERNAL";
  recurrenceGroup?: string | null;
  attachments: BookingAttachment[];
  equipments: BookingEquipmentDto[];
  approvals: ApprovalDto[];
}

export interface OccurrenceResult {
  startTime: string;
  endTime: string;
  outcome: "CREATED" | "WAITLISTED" | "REJECTED";
  booking?: Booking | null;
  waitlistEntry?: WaitlistEntry | null;
  reason?: string | null;
}

export interface BookingSubmitResult {
  recurring: boolean;
  waitlisted: boolean;
  booking?: Booking | null;
  waitlistEntry?: WaitlistEntry | null;
  occurrences?: OccurrenceResult[] | null;
}

export interface BookingSummary {
  id: number;
  code: string;
  roomId: number;
  roomName: string;
  requesterUnit: string;
  contactName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  submittedAt: string;
}

export interface BookingPublicStatus {
  code: string;
  roomName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  submittedAt: string;
  decidedAt?: string | null;
  cancelReason?: string | null;
}

export interface CalendarEvent {
  bookingId: number;
  roomId: number;
  roomName: string;
  title: string;
  start: string;
  end: string;
  status: BookingStatus;
}

export interface RoomSuggestion {
  roomId: number;
  code: string;
  name: string;
  capacity?: number | null;
  floor?: number | null;
}

export async function submitBooking(data: BookingSubmitData, files: File[]): Promise<BookingSubmitResult> {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  files.forEach((file) => formData.append("files", file));
  const { data: result } = await apiClient.post<BookingSubmitResult>("/public/bookings", formData);
  return result;
}

/** Staff (ADMIN/OFFICER) recording a booking directly — e.g. a phone/walk-in request
 * — instead of the requester using the public form. Same request shape as
 * submitBooking, just a different (authenticated) endpoint; see
 * BookingService#createInternal on the backend for why this doesn't auto-approve. */
export async function createInternalBooking(data: BookingSubmitData, files: File[]): Promise<BookingSubmitResult> {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  files.forEach((file) => formData.append("files", file));
  const { data: result } = await apiClient.post<BookingSubmitResult>("/bookings", formData);
  return result;
}

export async function lookupBooking(code: string, email: string): Promise<BookingPublicStatus> {
  const { data } = await apiClient.get<BookingPublicStatus>("/public/bookings/lookup", {
    params: { code, email },
  });
  return data;
}

export async function getPublicCalendar(from: string, to: string, roomId?: number): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>("/public/calendar", { params: { from, to, roomId } });
  return data;
}

export interface BookingListParams {
  status?: BookingStatus;
  roomId?: number;
  unit?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function listBookings(params: BookingListParams = {}): Promise<PageResponse<BookingSummary>> {
  const { data } = await apiClient.get<PageResponse<BookingSummary>>("/bookings", {
    params: { size: 20, ...params },
  });
  return data;
}

export async function getBooking(id: number): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
  return data;
}

export async function approveBooking(id: number, comment?: string): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/bookings/${id}/approve`, { comment });
  return data;
}

export async function rejectBooking(id: number, reason: string): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/bookings/${id}/reject`, { reason });
  return data;
}

export async function cancelBooking(id: number, reason: string): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/bookings/${id}/cancel`, { reason });
  return data;
}

export async function closeBooking(id: number): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/bookings/${id}/close`, {});
  return data;
}

export async function suggestRooms(id: number): Promise<RoomSuggestion[]> {
  const { data } = await apiClient.get<RoomSuggestion[]>(`/bookings/${id}/suggest-rooms`);
  return data;
}

export async function getAttachmentPreviewUrl(bookingId: number, attachmentId: number): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(
    `/bookings/${bookingId}/attachments/${attachmentId}/preview-url`,
  );
  return data.url;
}

/** The download endpoint requires a JWT (unlike /preview, which uses a signed
 * token), so a plain <a href> can't carry auth — fetch as a blob instead and
 * trigger the browser's save dialog from that. */
export async function downloadAttachment(bookingId: number, attachmentId: number, fileName: string): Promise<void> {
  const response = await apiClient.get(`/bookings/${bookingId}/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getInternalCalendar(from: string, to: string, roomId?: number): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>("/calendar", { params: { from, to, roomId } });
  return data;
}

export interface SignageRoomStatus {
  roomId: number;
  roomCode: string;
  roomName: string;
  floor?: number | null;
  occupied: boolean;
  occupiedUntil?: string | null;
  nextStart?: string | null;
}

export async function getSignage(): Promise<SignageRoomStatus[]> {
  const { data } = await apiClient.get<SignageRoomStatus[]>("/public/signage");
  return data;
}
