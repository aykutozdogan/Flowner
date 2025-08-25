import React from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Alert } from '@mui/material';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import BpmnDesigner from '@/components/workflows/BpmnDesigner';

export default function BpmnDesignerPage() {
  const { key } = useParams<{ key?: string }>();
  
  // Fetch existing workflow if editing
  const { data: workflowData, isLoading, error } = useQuery({
    queryKey: ['/api/v1/workflows', key],
    enabled: !!key,
    select: (data: any) => data.data || data,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: ({ xml, json }: { xml: string; json: any }) => {
      const payload = {
        key: key || `workflow_${Date.now()}`,
        name: `Workflow ${key || 'Yeni'}`,
        description: 'BPMN Designer ile oluşturuldu',
        bpmn_xml: xml,
        config: json,
        status: 'draft'
      };

      return key 
        ? apiRequest(`/api/v1/workflows/${key}`, { method: 'PUT', body: payload })
        : apiRequest('/api/v1/workflows', { method: 'POST', body: payload });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Workflow taslağı kaydedildi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Workflow kaydedilemedi',
        variant: 'destructive',
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: ({ xml, json, changelog }: { xml: string; json: any; changelog: string }) => {
      return apiRequest(`/api/v1/workflows/${key || 'new'}/publish`, {
        method: 'POST',
        body: { changelog, bpmn_xml: xml, config: json }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Workflow yayınlandı',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Workflow yayınlanamadı',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Workflow yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  const initialDefinition = workflowData?.bpmn_xml;

  return (
    <Box>
      <BpmnDesigner
        workflowKey={key}
        initialDefinition={initialDefinition}
        onSave={(xml, json) => saveDraftMutation.mutate({ xml, json })}
        onPublish={(xml, json, changelog) => publishMutation.mutate({ xml, json, changelog })}
      />
    </Box>
  );
}