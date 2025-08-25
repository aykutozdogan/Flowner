import React, { useState, useEffect } from 'react';
import { Box, TextField, TextareaAutosize, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Radio, RadioGroup, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';

interface FormField {
  name: string;
  type: string;
  required?: boolean;
  label: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  regex?: string;
  conditional?: {
    field: string;
    operator: string;
    value: any;
  };
}

interface FormSchema {
  fields: FormField[];
}

interface UiSchema {
  layout: string;
  columns?: number;
  fields: Record<string, any>;
}

interface FormRendererProps {
  schema: FormSchema;
  uiSchema: UiSchema;
  value: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  outcomes?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function FormRenderer({ schema, uiSchema, value, onSubmit, outcomes = [], disabled = false }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(value || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');

  useEffect(() => {
    setFormData(value || {});
  }, [value]);

  // Field değeri değiştiğinde
  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Conditional görünürlük kontrolü
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.conditional) return true;
    
    const { field: condField, operator, value: condValue } = field.conditional;
    const fieldValue = formData[condField];
    
    switch (operator) {
      case 'equals':
        return fieldValue === condValue;
      case 'not_equals':
        return fieldValue !== condValue;
      case 'greater_than':
        return Number(fieldValue) > Number(condValue);
      case 'less_than':
        return Number(fieldValue) < Number(condValue);
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(condValue);
      default:
        return true;
    }
  };

  // Validasyon
  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} alanı zorunludur`;
    }
    
    if (field.type === 'number' && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label} geçerli bir sayı olmalıdır`;
      }
      if (field.min !== undefined && numValue < field.min) {
        return `${field.label} en az ${field.min} olmalıdır`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `${field.label} en fazla ${field.max} olmalıdır`;
      }
    }
    
    if (field.regex && value) {
      const regex = new RegExp(field.regex);
      if (!regex.test(value)) {
        return `${field.label} geçerli formatta olmalıdır`;
      }
    }
    
    return null;
  };

  // Form submit
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    // Tüm görünür alanları validate et
    schema.fields.forEach(field => {
      if (isFieldVisible(field)) {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    
    if (outcomes.length > 0 && !selectedOutcome) {
      newErrors._outcome = 'Lütfen bir seçenek belirleyin';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        ...(selectedOutcome && { _outcome: selectedOutcome })
      });
    }
  };

  // Field render
  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;
    
    const fieldProps = uiSchema.fields[field.name] || {};
    const error = errors[field.name];
    
    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={field.name}
            label={field.label}
            placeholder={field.placeholder || fieldProps.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!error}
            helperText={error}
            disabled={disabled}
            fullWidth
            data-testid={`input-${field.name}`}
          />
        );
        
      case 'textarea':
        return (
          <Box key={field.name}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {field.label}{field.required && ' *'}
            </Typography>
            <TextareaAutosize
              placeholder={field.placeholder || fieldProps.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={disabled}
              minRows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderColor: error ? '#d32f2f' : '#c4c4c4',
                borderRadius: '4px',
                fontFamily: 'inherit'
              }}
              data-testid={`textarea-${field.name}`}
            />
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {error}
              </Typography>
            )}
          </Box>
        );
        
      case 'number':
        return (
          <TextField
            key={field.name}
            type="number"
            label={field.label}
            placeholder={field.placeholder || fieldProps.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!error}
            helperText={error}
            disabled={disabled}
            fullWidth
            data-testid={`input-${field.name}`}
          />
        );
        
      case 'select':
        return (
          <FormControl key={field.name} fullWidth error={!!error} disabled={disabled}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              label={field.label}
              data-testid={`select-${field.name}`}
            >
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {error}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={formData[field.name] || false}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                disabled={disabled}
                data-testid={`checkbox-${field.name}`}
              />
            }
            label={field.label}
          />
        );
        
      case 'radio':
        return (
          <Box key={field.name}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {field.label}{field.required && ' *'}
            </Typography>
            <RadioGroup
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            >
              {field.options?.map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio disabled={disabled} />}
                  label={option.label}
                  data-testid={`radio-${field.name}-${option.value}`}
                />
              ))}
            </RadioGroup>
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {error}
              </Typography>
            )}
          </Box>
        );
        
      case 'date':
        return (
          <LocalizationProvider key={field.name} dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <DatePicker
              label={field.label}
              value={formData[field.name] ? new Date(formData[field.name]) : null}
              onChange={(date) => handleFieldChange(field.name, date?.toISOString())}
              disabled={disabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  helperText: error,
                  inputProps: {
                    'data-testid': `date-${field.name}`
                  }
                }
              }}
            />
          </LocalizationProvider>
        );
        
      default:
        return (
          <TextField
            key={field.name}
            label={field.label}
            placeholder={field.placeholder || fieldProps.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={!!error}
            helperText={error}
            disabled={disabled}
            fullWidth
            data-testid={`input-${field.name}`}
          />
        );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: uiSchema.layout === 'grid' && uiSchema.columns 
              ? `repeat(${uiSchema.columns}, 1fr)` 
              : '1fr'
          }}
        >
          {schema.fields.map(renderField)}
        </Box>
        
        {outcomes.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Karar
            </Typography>
            <FormControl fullWidth error={!!errors._outcome}>
              <InputLabel>Seçenek</InputLabel>
              <Select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                label="Seçenek"
                disabled={disabled}
                data-testid="select-outcome"
              >
                {outcomes.map(outcome => (
                  <MenuItem key={outcome.value} value={outcome.value}>
                    {outcome.label}
                  </MenuItem>
                ))}
              </Select>
              {errors._outcome && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors._outcome}
                </Typography>
              )}
            </FormControl>
          </Box>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={disabled}
            size="large"
            data-testid="button-submit"
          >
            Tamamla
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}