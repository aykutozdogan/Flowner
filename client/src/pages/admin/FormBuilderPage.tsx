import React from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Alert } from '@mui/material';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import FormBuilder from '@/components/forms/FormBuilder';

export default function FormBuilderPage() {
  const { key } = useParams<{ key?: string }>();
  
  // Fetch existing form if editing
  const { data: formData, isLoading, error } = useQuery({
    queryKey: ['/api/v1/forms', key],
    enabled: !!key,
    select: (data: any) => data.data || data,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (schema: any) => {
      const payload = {
        key: key || `form_${Date.now()}`,
        name: schema.title,
        description: schema.description,
        schema_json: schema,
        ui_schema_json: { layout: 'standard' },
        status: 'draft'
      };

      return key 
        ? apiRequest(`/api/v1/forms/${key}`, { method: 'PUT', body: payload })
        : apiRequest('/api/v1/forms', { method: 'POST', body: payload });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Form taslağı kaydedildi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/forms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Form kaydedilemedi',
        variant: 'destructive',
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: ({ schema, changelog }: { schema: any; changelog: string }) => {
      return apiRequest(`/api/v1/forms/${key || schema.key}/publish`, {
        method: 'POST',
        body: { changelog, schema_json: schema }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Form yayınlandı',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/forms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Form yayınlanamadı',
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
          Form yüklenirken hata oluştu: {(error as any)?.message}
        </Alert>
      </Box>
    );
  }

  const initialSchema = formData?.schema_json || {
    title: 'Yeni Form',
    description: '',
    fields: []
  };

  return (
    <Box>
      <FormBuilder
        formKey={key}
        initialSchema={initialSchema}
        onSave={(schema) => saveDraftMutation.mutate(schema)}
        onPublish={(schema, changelog) => publishMutation.mutate({ schema, changelog })}
      />
    </Box>
  );
}