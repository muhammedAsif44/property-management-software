import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, CreateTemplatePayload } from '../services/invoice.service';
import { useToast } from '@/components/ui/toast';

export function useTemplatesQuery() {
  return useQuery({
    queryKey: ['invoice-templates'],
    queryFn: () => invoiceService.getTemplates(),
  });
}

export function useIssueInvoiceMutation(bookingId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => invoiceService.issueInvoice(bookingId),
    onSuccess: (data) => {
      toast.success(data?.message || 'Invoice issued', 'Success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to issue invoice', 'Error');
    },
  });
}

export function useSaveDraftTemplateMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => invoiceService.saveDraftTemplate(payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Draft saved', 'Saved');
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save draft', 'Error');
    },
  });
}

export function usePublishTemplateMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (templateId: string) => invoiceService.publishTemplate(templateId),
    onSuccess: (data) => {
      toast.success(data?.message || 'Template published', 'Published');
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to publish template', 'Error');
    },
  });
}
