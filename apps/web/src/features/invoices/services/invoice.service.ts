import { httpClient } from '@/lib/api/http-client';

export interface CreateTemplatePayload {
  name: string;
  htmlContent: string;
  themeConfig?: Record<string, any>;
}

export const invoiceService = {
  async issueInvoice(bookingId: string) {
    const raw = await httpClient.post<any>(`/bookings/${bookingId}/invoice`);
    return raw?.data || raw;
  },

  async generatePreview(bookingId: string, templateId?: string, isAgency = false) {
    const q = templateId ? `?templateId=${templateId}&isAgency=${isAgency}` : `?isAgency=${isAgency}`;
    const raw = await httpClient.post<any>(`/bookings/${bookingId}/invoice/preview${q}`);
    return raw?.data || raw;
  },

  async getTemplates() {
    const raw = await httpClient.get<any>(`/invoice-templates`);
    return raw?.data || raw;
  },

  async saveDraftTemplate(payload: CreateTemplatePayload) {
    const raw = await httpClient.post<any>(`/invoice-templates`, payload);
    return raw?.data || raw;
  },

  async publishTemplate(templateId: string) {
    const raw = await httpClient.post<any>(`/invoice-templates/${templateId}/publish`);
    return raw?.data || raw;
  },
};
