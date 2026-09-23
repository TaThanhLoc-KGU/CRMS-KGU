import { apiClient } from "./client";

export interface EmailTemplate {
  id: number;
  code: string;
  subject: string;
  bodyHtml: string;
  active: boolean;
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const { data } = await apiClient.get<EmailTemplate[]>("/email-templates");
  return data;
}

export async function updateEmailTemplate(
  code: string,
  subject: string,
  bodyHtml: string,
  active: boolean,
): Promise<EmailTemplate> {
  const { data } = await apiClient.put<EmailTemplate>(`/email-templates/${code}`, { subject, bodyHtml, active });
  return data;
}
