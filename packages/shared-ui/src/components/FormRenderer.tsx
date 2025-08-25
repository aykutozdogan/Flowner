import React from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Checkbox, 
  FormControlLabel,
  Button,
  Box,
  Typography
} from '@mui/material';
import { FormSchema, FormField } from '@flowner/shared-core';

interface FormRendererProps {
  schema: FormSchema;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  readonly?: boolean;
}

const FormFieldRenderer: React.FC<{
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  readonly?: boolean;
}> = ({ field, value, onChange, readonly = false }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    let newValue = event.target.value;
    
    if (field.type === 'number') {
      newValue = parseFloat(newValue) || 0;
    }
    
    onChange(newValue);
  };

  switch (field.type) {
    case 'text':
      return (
        <TextField
          fullWidth
          label={field.label}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helpText}
          disabled={readonly}
          margin="normal"
        />
      );

    case 'textarea':
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
          label={field.label}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helpText}
          disabled={readonly}
          margin="normal"
        />
      );

    case 'number':
      return (
        <TextField
          fullWidth
          type="number"
          label={field.label}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          placeholder={field.placeholder}
          helperText={field.helpText}
          disabled={readonly}
          margin="normal"
          inputProps={{
            min: field.validation?.min,
            max: field.validation?.max,
          }}
        />
      );

    case 'select':
      return (
        <FormControl fullWidth margin="normal" required={field.required}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={handleChange}
            disabled={readonly}
            label={field.label}
          >
            {field.options?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case 'date':
      return (
        <TextField
          fullWidth
          type="date"
          label={field.label}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          helperText={field.helpText}
          disabled={readonly}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      );

    default:
      return (
        <TextField
          fullWidth
          label={field.label}
          value={value || ''}
          onChange={handleChange}
          required={field.required}
          disabled={readonly}
          margin="normal"
        />
      );
  }
};

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  values,
  onChange,
  onSubmit,
  submitLabel = 'Gönder',
  readonly = false,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {schema.title}
      </Typography>
      
      {schema.description && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {schema.description}
        </Typography>
      )}

      {schema.fields.map((field) => (
        <FormFieldRenderer
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
          readonly={readonly}
        />
      ))}

      {!readonly && onSubmit && (
        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
          >
            {submitLabel}
          </Button>
        </Box>
      )}
    </Box>
  );
};