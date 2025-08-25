import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Publish as PublishIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'time' | 'datetime' | 'checkbox' | 'radio' | 'file';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  defaultValue?: any;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  conditionalLogic?: {
    field: string;
    condition: string;
    value: any;
  };
}

interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormBuilderProps {
  formKey?: string;
  initialSchema?: FormSchema;
  onSave?: (schema: FormSchema) => void;
  onPublish?: (schema: FormSchema, changelog: string) => void;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Metin', icon: '📝' },
  { type: 'textarea', label: 'Çok Satır Metin', icon: '📄' },
  { type: 'number', label: 'Sayı', icon: '🔢' },
  { type: 'select', label: 'Seçim', icon: '📋' },
  { type: 'multiselect', label: 'Çoklu Seçim', icon: '☑️' },
  { type: 'date', label: 'Tarih', icon: '📅' },
  { type: 'time', label: 'Saat', icon: '⏰' },
  { type: 'datetime', label: 'Tarih & Saat', icon: '📅⏰' },
  { type: 'checkbox', label: 'Onay Kutusu', icon: '✅' },
  { type: 'radio', label: 'Radyo Buton', icon: '🔘' },
  { type: 'file', label: 'Dosya', icon: '📎' }
];

const DraggableFieldType = ({ fieldType, onAdd }: { fieldType: any; onAdd: (type: string) => void }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD_TYPE',
    item: { fieldType: fieldType.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Card 
      ref={drag}
      sx={{ 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'grab',
        '&:hover': { boxShadow: 2 },
        mb: 1
      }}
      onClick={() => onAdd(fieldType.type)}
      data-testid={`field-type-${fieldType.type}`}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="body2" align="center">
          {fieldType.icon} {fieldType.label}
        </Typography>
      </CardContent>
    </Card>
  );
};

const DroppableCanvas = ({ children, onDrop }: { children: React.ReactNode; onDrop: (item: any) => void }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'FIELD_TYPE',
    drop: (item: any) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <Box
      ref={drop}
      sx={{
        minHeight: '400px',
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        p: 2,
        backgroundColor: isOver ? 'action.hover' : 'background.paper'
      }}
      data-testid="form-canvas"
    >
      {children}
    </Box>
  );
};

const FieldEditor = ({ field, onUpdate, onDelete }: {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}) => {
  const [editField, setEditField] = useState(field);

  const handleUpdate = () => {
    onUpdate(editField);
  };

  return (
    <Card sx={{ mb: 2 }} data-testid={`field-editor-${field.id}`}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DragIcon sx={{ mr: 1, cursor: 'grab' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {FIELD_TYPES.find(t => t.type === field.type)?.label}
          </Typography>
          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Alan Adı"
            value={editField.name}
            onChange={(e) => setEditField({ ...editField, name: e.target.value })}
            onBlur={handleUpdate}
            size="small"
            data-testid={`field-name-${field.id}`}
          />
          
          <TextField
            label="Etiket"
            value={editField.label}
            onChange={(e) => setEditField({ ...editField, label: e.target.value })}
            onBlur={handleUpdate}
            size="small"
          />

          <TextField
            label="Placeholder"
            value={editField.placeholder || ''}
            onChange={(e) => setEditField({ ...editField, placeholder: e.target.value })}
            onBlur={handleUpdate}
            size="small"
          />

          <FormControlLabel
            control={
              <Switch
                checked={editField.required || false}
                onChange={(e) => {
                  const updated = { ...editField, required: e.target.checked };
                  setEditField(updated);
                  onUpdate(updated);
                }}
              />
            }
            label="Zorunlu"
          />

          {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Seçenekler</Typography>
              {editField.options?.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    label="Değer"
                    value={option.value}
                    onChange={(e) => {
                      const newOptions = [...(editField.options || [])];
                      newOptions[index] = { ...option, value: e.target.value };
                      setEditField({ ...editField, options: newOptions });
                    }}
                    onBlur={handleUpdate}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Etiket"
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...(editField.options || [])];
                      newOptions[index] = { ...option, label: e.target.value };
                      setEditField({ ...editField, options: newOptions });
                    }}
                    onBlur={handleUpdate}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>
              ))}
              <Button
                size="small"
                onClick={() => {
                  const newOptions = [...(editField.options || []), { value: '', label: '' }];
                  const updated = { ...editField, options: newOptions };
                  setEditField(updated);
                  onUpdate(updated);
                }}
                startIcon={<AddIcon />}
              >
                Seçenek Ekle
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export const FormBuilder: React.FC<FormBuilderProps> = ({
  formKey,
  initialSchema,
  onSave,
  onPublish
}) => {
  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || {
      title: 'Yeni Form',
      description: '',
      fields: []
    }
  );
  
  const [history, setHistory] = useState<FormSchema[]>([schema]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');

  const addToHistory = useCallback((newSchema: FormSchema) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSchema);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSchema(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSchema(history[historyIndex + 1]);
    }
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: fieldType as any,
      name: `field_${Date.now()}`,
      label: `Yeni ${FIELD_TYPES.find(t => t.type === fieldType)?.label}`,
      required: false,
      ...(fieldType === 'select' || fieldType === 'multiselect' || fieldType === 'radio' 
        ? { options: [{ value: '', label: '' }] }
        : {}
      )
    };

    const newSchema = {
      ...schema,
      fields: [...schema.fields, newField]
    };
    
    setSchema(newSchema);
    addToHistory(newSchema);
  };

  const updateField = (fieldId: string, updatedField: FormField) => {
    const newSchema = {
      ...schema,
      fields: schema.fields.map(f => f.id === fieldId ? updatedField : f)
    };
    
    setSchema(newSchema);
    addToHistory(newSchema);
  };

  const deleteField = (fieldId: string) => {
    const newSchema = {
      ...schema,
      fields: schema.fields.filter(f => f.id !== fieldId)
    };
    
    setSchema(newSchema);
    addToHistory(newSchema);
  };

  const handleSave = () => {
    onSave?.(schema);
  };

  const handlePublish = () => {
    onPublish?.(schema, changelog);
    setPublishDialogOpen(false);
    setChangelog('');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Left Palette */}
        <Box sx={{ width: 250, borderRight: 1, borderColor: 'divider', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Alan Tipleri
          </Typography>
          
          {FIELD_TYPES.map((fieldType) => (
            <DraggableFieldType
              key={fieldType.type}
              fieldType={fieldType}
              onAdd={addField}
            />
          ))}
        </Box>

        {/* Center Canvas */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Form Builder</Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={undo}
                disabled={historyIndex === 0}
                startIcon={<UndoIcon />}
                data-testid="undo-button"
              >
                Geri Al
              </Button>
              
              <Button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                startIcon={<RedoIcon />}
                data-testid="redo-button"
              >
                İleri Al
              </Button>
              
              <Button
                onClick={handleSave}
                startIcon={<SaveIcon />}
                variant="outlined"
                data-testid="save-button"
              >
                Taslak Kaydet
              </Button>
              
              <Button
                onClick={() => setPublishDialogOpen(true)}
                startIcon={<PublishIcon />}
                variant="contained"
                data-testid="publish-button"
              >
                Yayınla
              </Button>
            </Box>
          </Box>

          <TextField
            label="Form Başlığı"
            value={schema.title}
            onChange={(e) => setSchema({ ...schema, title: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
            data-testid="form-title"
          />

          <DroppableCanvas onDrop={(item) => addField(item.fieldType)}>
            {schema.fields.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <Typography variant="h6">
                  Form alanlarını buraya sürükleyin
                </Typography>
                <Typography variant="body2">
                  Soldan bir alan tipi seçin ve buraya sürükleyin veya tıklayın
                </Typography>
              </Box>
            ) : (
              schema.fields.map((field) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(updatedField) => updateField(field.id, updatedField)}
                  onDelete={() => deleteField(field.id)}
                />
              ))
            )}
          </DroppableCanvas>
        </Box>
      </Box>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle>Formu Yayınla</DialogTitle>
        <DialogContent>
          <TextField
            label="Değişiklik Notları"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ mt: 1 }}
            placeholder="Bu sürümde yapılan değişiklikleri açıklayın..."
            data-testid="changelog-input"
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setPublishDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handlePublish}
              variant="contained"
              disabled={!changelog.trim()}
              data-testid="confirm-publish"
            >
              Yayınla
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
};

export default FormBuilder;