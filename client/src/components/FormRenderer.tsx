import React, { useState, useEffect } from 'react';
import { 
  TextBox as DxTextBox,
  TextArea as DxTextArea, 
  SelectBox as DxSelectBox,
  CheckBox as DxCheckBox,
  RadioGroup as DxRadioGroup,
  Button as DxButton,
  DateBox as DxDateBox
} from 'devextreme-react';

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
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxTextBox
              placeholder={field.placeholder || fieldProps.placeholder}
              value={formData[field.name] || ''}
              onValueChanged={(e) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              width="100%"
              height={40}
              elementAttr={{
                'data-testid': `input-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxTextArea
              placeholder={field.placeholder || fieldProps.placeholder}
              value={formData[field.name] || ''}
              onValueChanged={(e) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              height={120}
              width="100%"
              elementAttr={{
                'data-testid': `textarea-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxTextBox
              placeholder={field.placeholder || fieldProps.placeholder}
              value={formData[field.name] || ''}
              onValueChanged={(e) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              width="100%"
              height={40}
              elementAttr={{
                'data-testid': `input-${field.name}`,
                type: 'number'
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxSelectBox
              dataSource={field.options || []}
              displayExpr="label"
              valueExpr="value"
              value={formData[field.name] || ''}
              onValueChanged={(e) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              width="100%"
              height={40}
              placeholder={`${field.label} seçin...`}
              searchEnabled={false}
              showClearButton={true}
              elementAttr={{
                'data-testid': `select-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={field.name} className="space-y-2">
            <DxCheckBox
              value={formData[field.name] || false}
              text={field.label}
              onValueChanged={(e) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              elementAttr={{
                'data-testid': `checkbox-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'radio':
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {field.label}{field.required && ' *'}
            </label>
            <DxRadioGroup
              dataSource={field.options || []}
              displayExpr="label"
              valueExpr="value"
              value={formData[field.name] || ''}
              onValueChanged={(e: any) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              layout="vertical"
              elementAttr={{
                'data-testid': `radio-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxDateBox
              type="date"
              value={formData[field.name] ? new Date(formData[field.name]) : null}
              onValueChanged={(e) => handleFieldChange(field.name, e.value?.toISOString())}
              disabled={disabled}
              width="100%"
              height={40}
              elementAttr={{
                'data-testid': `date-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
        
      default:
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
            <DxTextBox
              placeholder={field.placeholder || fieldProps.placeholder}
              value={formData[field.name] || ''}
              onValueChanged={(e: any) => handleFieldChange(field.name, e.value)}
              disabled={disabled}
              width="100%"
              height={40}
              elementAttr={{
                'data-testid': `input-${field.name}`
              }}
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          display: 'grid',
          gap: '24px',
          gridTemplateColumns: uiSchema.layout === 'grid' && uiSchema.columns 
            ? `repeat(${uiSchema.columns}, 1fr)` 
            : '1fr'
        }}
      >
        {schema.fields.map(renderField)}
      </div>
      
      {outcomes.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
            Karar
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Seçenek</label>
            <DxSelectBox
              dataSource={outcomes}
              displayExpr="label"
              valueExpr="value"
              value={selectedOutcome}
              onValueChanged={(e: any) => setSelectedOutcome(e.value)}
              disabled={disabled}
              width="100%"
              height={40}
              placeholder="Seçenek seçin..."
              searchEnabled={false}
              showClearButton={true}
              elementAttr={{
                'data-testid': 'select-outcome'
              }}
            />
            {errors._outcome && (
              <span className="text-sm text-red-500">{errors._outcome}</span>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 flex gap-2 justify-end">
        <DxButton
          text="Tamamla"
          type="default"
          stylingMode="contained"
          onClick={handleSubmit}
          disabled={disabled}
          height={44}
          width={120}
          elementAttr={{
            'data-testid': 'button-submit'
          }}
        />
      </div>
    </div>
  );
}