import { apiClient } from "./client";

export interface SetupStyle {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface SetupStyleRequest {
  code: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface EquipmentCatalogItem {
  id: number;
  code: string;
  name: string;
  unit?: string | null;
  shared: boolean;
  defaultQuantity: number;
}

export interface EquipmentCatalogRequest {
  code: string;
  name: string;
  unit?: string;
  shared?: boolean;
  defaultQuantity?: number;
  active?: boolean;
}

export interface PublicHoliday {
  id: number;
  holidayDate: string;
  name: string;
}

export interface WorkingHoursItem {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workingDay: boolean;
}

export const setupStylesApi = {
  list: async () => (await apiClient.get<SetupStyle[]>("/setup-styles")).data,
  create: async (req: SetupStyleRequest) => (await apiClient.post<SetupStyle>("/setup-styles", req)).data,
  update: async (id: number, req: SetupStyleRequest) =>
    (await apiClient.put<SetupStyle>(`/setup-styles/${id}`, req)).data,
  remove: async (id: number) => apiClient.delete(`/setup-styles/${id}`),
};

export const equipmentCatalogApi = {
  list: async () => (await apiClient.get<EquipmentCatalogItem[]>("/equipments")).data,
  create: async (req: EquipmentCatalogRequest) => (await apiClient.post<EquipmentCatalogItem>("/equipments", req)).data,
  update: async (id: number, req: EquipmentCatalogRequest) =>
    (await apiClient.put<EquipmentCatalogItem>(`/equipments/${id}`, req)).data,
  remove: async (id: number) => apiClient.delete(`/equipments/${id}`),
};

export const holidaysApi = {
  list: async () => (await apiClient.get<PublicHoliday[]>("/holidays")).data,
  create: async (holidayDate: string, name: string) =>
    (await apiClient.post<PublicHoliday>("/holidays", { holidayDate, name })).data,
  remove: async (id: number) => apiClient.delete(`/holidays/${id}`),
};

export const workingHoursApi = {
  list: async () => (await apiClient.get<WorkingHoursItem[]>("/working-hours")).data,
  update: async (dayOfWeek: number, startTime: string, endTime: string, workingDay: boolean) =>
    (await apiClient.put<WorkingHoursItem>(`/working-hours/${dayOfWeek}`, { startTime, endTime, workingDay })).data,
};
