import { apiClient } from "./client";

export interface ConfigItem {
  key: string;
  value: string;
  valueType: string;
  group: string;
  description?: string;
}

export async function listConfig(): Promise<Record<string, ConfigItem[]>> {
  const { data } = await apiClient.get<Record<string, ConfigItem[]>>("/config");
  return data;
}

export async function updateConfig(values: Record<string, string>): Promise<Record<string, ConfigItem[]>> {
  const { data } = await apiClient.put<Record<string, ConfigItem[]>>("/config", values);
  return data;
}

export async function testSmtp(toEmail: string): Promise<void> {
  await apiClient.post("/config/smtp/test", { toEmail });
}
