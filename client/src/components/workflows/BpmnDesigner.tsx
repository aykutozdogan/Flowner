import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

// BPMN.js imports
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

interface BpmnDesignerProps {
  workflowKey?: string;
  initialDefinition?: string;
  onSave?: (xml: string, json: any) => void;
  onPublish?: (xml: string, json: any, changelog: string) => void;
}

interface UserTaskProperties {
  id: string;
  name: string;
  assigneeRole?: string;
  assigneeUser?: string;
  formKey?: string;
  formVersion?: number;
}

interface ServiceTaskProperties {
  id: string;
  name: string;
  type: 'http' | 'handler';
  httpConfig?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    bodyTemplate: string;
    timeoutMs: number;
    retry: {
      maxAttempts: number;
      backoffMs: number;
    };
    authProfileKey?: string;
  };
  handlerConfig?: {
    name: string;
    params: Record<string, any>;
  };
}

interface GatewayProperties {
  id: string;
  name: string;
  expression?: string;
}

const defaultBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const BpmnDesigner: React.FC<BpmnDesignerProps> = ({
  workflowKey,
  initialDefinition,
  onSave,
  onPublish
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);

  // Available forms for UserTask assignment
  const [availableForms, setAvailableForms] = useState<Array<{
    key: string;
    name: string;
    version: number;
  }>>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      },
      additionalModules: [
        // Custom palette module can be added here
      ]
    });

    modelerRef.current = modeler;

    // Customize palette after modeler is ready
    const customizePalette = () => {
      try {
        const palette = modeler.get('palette');
        const canvas = modeler.get('canvas');
        
        // Add custom palette styling
        const paletteContainer = document.querySelector('.djs-palette');
        if (paletteContainer) {
          paletteContainer.setAttribute('style', `
            background: var(--background);
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid var(--border);
          `);
          
          // Add tooltips and descriptions
          const entries = paletteContainer.querySelectorAll('.entry');
          entries.forEach((entry: any) => {
            const title = entry.getAttribute('title');
            if (title) {
              entry.setAttribute('data-tooltip', getElementDescription(title));
            }
          });
        }
      } catch (error) {
        console.log('Palette customization not available:', error);
      }
    };

    // Load initial diagram
    const loadDiagram = async () => {
      try {
        await modeler.importXML(initialDefinition || defaultBpmnXml);
        
        // Customize palette after diagram load
        setTimeout(customizePalette, 500);
        
        // Add event listeners
        const eventBus = modeler.get('eventBus');
        eventBus.on('element.click', (event: any) => {
          setSelectedElement(event.element);
          setPropertiesPanelOpen(true);
        });

      } catch (error) {
        console.error('Error loading BPMN diagram:', error);
      }
    };

    loadDiagram();

    return () => {
      modeler.destroy();
    };
  }, [initialDefinition]);

  const getElementDescription = (elementType: string): string => {
    const descriptions: Record<string, string> = {
      'Create StartEvent': 'Sürecin başlangıç noktası',
      'Create EndEvent': 'Sürecin bitiş noktası',
      'Create Task': 'Genel görev elementi',
      'Create UserTask': 'Kullanıcı görevi - Form ile tamamlanır',
      'Create ServiceTask': 'Servis görevi - Otomatik işlem',
      'Create ExclusiveGateway': 'Karar noktası - Tek yol seçimi',
      'Create ParallelGateway': 'Paralel işlem - Çoklu yol',
      'Create SubProcess': 'Alt süreç - Gruplandırma'
    };
    return descriptions[elementType] || elementType;
  };

  const handleSave = async () => {
    if (!modelerRef.current) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const json = await convertToEngineFormat(xml);
      onSave?.(xml, json);
    } catch (error) {
      console.error('Error saving BPMN:', error);
    }
  };

  const handlePublish = async () => {
    if (!modelerRef.current) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const json = await convertToEngineFormat(xml);
      onPublish?.(xml, json, changelog);
      setPublishDialogOpen(false);
      setChangelog('');
    } catch (error) {
      console.error('Error publishing BPMN:', error);
    }
  };

  const convertToEngineFormat = async (xml: string) => {
    // Convert BPMN XML to our engine's JSON format
    // This is a simplified converter - in production you'd want more robust parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const processElements = doc.querySelectorAll('bpmn\\:process, process');
    const engineFormat: any = {
      nodes: [],
      edges: []
    };

    processElements.forEach(process => {
      // Extract start events
      const startEvents = process.querySelectorAll('bpmn\\:startEvent, startEvent');
      startEvents.forEach(start => {
        engineFormat.nodes.push({
          id: start.getAttribute('id'),
          type: 'start',
          name: start.getAttribute('name') || 'Start'
        });
      });

      // Extract user tasks
      const userTasks = process.querySelectorAll('bpmn\\:userTask, userTask');
      userTasks.forEach(task => {
        engineFormat.nodes.push({
          id: task.getAttribute('id'),
          type: 'userTask',
          name: task.getAttribute('name') || 'User Task',
          assigneeRole: task.getAttribute('assigneeRole'),
          formKey: task.getAttribute('formKey'),
          formVersion: parseInt(task.getAttribute('formVersion') || '1')
        });
      });

      // Extract service tasks
      const serviceTasks = process.querySelectorAll('bpmn\\:serviceTask, serviceTask');
      serviceTasks.forEach(task => {
        engineFormat.nodes.push({
          id: task.getAttribute('id'),
          type: 'serviceTask',
          name: task.getAttribute('name') || 'Service Task',
          serviceType: task.getAttribute('serviceType') || 'http'
        });
      });

      // Extract gateways
      const exclusiveGateways = process.querySelectorAll('bpmn\\:exclusiveGateway, exclusiveGateway');
      exclusiveGateways.forEach(gateway => {
        engineFormat.nodes.push({
          id: gateway.getAttribute('id'),
          type: 'exclusiveGateway',
          name: gateway.getAttribute('name') || 'Gateway'
        });
      });

      // Extract end events
      const endEvents = process.querySelectorAll('bpmn\\:endEvent, endEvent');
      endEvents.forEach(end => {
        engineFormat.nodes.push({
          id: end.getAttribute('id'),
          type: 'end',
          name: end.getAttribute('name') || 'End'
        });
      });

      // Extract sequence flows (edges)
      const sequenceFlows = process.querySelectorAll('bpmn\\:sequenceFlow, sequenceFlow');
      sequenceFlows.forEach(flow => {
        engineFormat.edges.push({
          id: flow.getAttribute('id'),
          source: flow.getAttribute('sourceRef'),
          target: flow.getAttribute('targetRef'),
          condition: flow.getAttribute('condition')
        });
      });
    });

    return engineFormat;
  };

  const updateElementProperties = (properties: any) => {
    if (!modelerRef.current || !selectedElement) return;

    const modeling = modelerRef.current.get('modeling');
    
    // Update element properties based on type
    if (selectedElement.type === 'bpmn:UserTask') {
      modeling.updateProperties(selectedElement, {
        name: properties.name,
        'custom:assigneeRole': properties.assigneeRole,
        'custom:formKey': properties.formKey,
        'custom:formVersion': properties.formVersion
      });
    } else if (selectedElement.type === 'bpmn:ServiceTask') {
      modeling.updateProperties(selectedElement, {
        name: properties.name,
        'custom:serviceType': properties.type,
        'custom:httpConfig': JSON.stringify(properties.httpConfig),
        'custom:handlerConfig': JSON.stringify(properties.handlerConfig)
      });
    } else if (selectedElement.type === 'bpmn:ExclusiveGateway') {
      modeling.updateProperties(selectedElement, {
        name: properties.name,
        'custom:expression': properties.expression
      });
    } else {
      modeling.updateProperties(selectedElement, {
        name: properties.name
      });
    }
  };

  const renderPropertiesPanel = () => {
    if (!selectedElement) return null;

    const elementType = selectedElement.type;
    const businessObject = selectedElement.businessObject;

    return (
      <Box>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Genel" />
          {elementType === 'bpmn:UserTask' && <Tab label="Form" />}
          {elementType === 'bpmn:ServiceTask' && <Tab label="Servis" />}
          {elementType === 'bpmn:ExclusiveGateway' && <Tab label="Koşul" />}
        </Tabs>

        {/* General Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Ad"
              value={businessObject?.name || ''}
              onChange={(e) => updateElementProperties({ 
                ...businessObject, 
                name: e.target.value 
              })}
              fullWidth
              sx={{ mb: 2 }}
              data-testid="element-name"
            />

            <TextField
              label="ID"
              value={selectedElement.id}
              disabled
              fullWidth
              sx={{ mb: 2 }}
            />
          </Box>
        )}

        {/* UserTask Form Tab */}
        {tabValue === 1 && elementType === 'bpmn:UserTask' && (
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Atanacak Rol</InputLabel>
              <Select
                value={businessObject?.['custom:assigneeRole'] || ''}
                onChange={(e) => updateElementProperties({
                  ...businessObject,
                  assigneeRole: e.target.value
                })}
                data-testid="assignee-role"
              >
                <MenuItem value="user">Kullanıcı</MenuItem>
                <MenuItem value="approver">Onaylayıcı</MenuItem>
                <MenuItem value="designer">Tasarımcı</MenuItem>
                <MenuItem value="tenant_admin">Yönetici</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Form</InputLabel>
              <Select
                value={businessObject?.['custom:formKey'] || ''}
                onChange={(e) => updateElementProperties({
                  ...businessObject,
                  formKey: e.target.value
                })}
                data-testid="form-key"
              >
                {availableForms.map(form => (
                  <MenuItem key={form.key} value={form.key}>
                    {form.name} (v{form.version})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* ServiceTask Service Tab */}
        {tabValue === 1 && elementType === 'bpmn:ServiceTask' && (
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Servis Tipi</InputLabel>
              <Select
                value={businessObject?.['custom:serviceType'] || 'http'}
                onChange={(e) => updateElementProperties({
                  ...businessObject,
                  serviceType: e.target.value
                })}
                data-testid="service-type"
              >
                <MenuItem value="http">HTTP İsteği</MenuItem>
                <MenuItem value="handler">Handler Fonksiyonu</MenuItem>
              </Select>
            </FormControl>

            {businessObject?.['custom:serviceType'] === 'http' && (
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>HTTP Metodu</InputLabel>
                  <Select
                    value={businessObject?.['custom:httpMethod'] || 'GET'}
                    onChange={(e) => updateElementProperties({
                      ...businessObject,
                      httpMethod: e.target.value
                    })}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="URL"
                  value={businessObject?.['custom:httpUrl'] || ''}
                  onChange={(e) => updateElementProperties({
                    ...businessObject,
                    httpUrl: e.target.value
                  })}
                  fullWidth
                  placeholder="https://api.example.com/endpoint"
                />

                <TextField
                  label="Timeout (ms)"
                  type="number"
                  value={businessObject?.['custom:httpTimeout'] || 5000}
                  onChange={(e) => updateElementProperties({
                    ...businessObject,
                    httpTimeout: parseInt(e.target.value)
                  })}
                  fullWidth
                />
              </Stack>
            )}

            {businessObject?.['custom:serviceType'] === 'handler' && (
              <Stack spacing={2}>
                <TextField
                  label="Handler Adı"
                  value={businessObject?.['custom:handlerName'] || ''}
                  onChange={(e) => updateElementProperties({
                    ...businessObject,
                    handlerName: e.target.value
                  })}
                  fullWidth
                  placeholder="processPayment"
                />

                <TextField
                  label="Parametreler (JSON)"
                  value={businessObject?.['custom:handlerParams'] || '{}'}
                  onChange={(e) => updateElementProperties({
                    ...businessObject,
                    handlerParams: e.target.value
                  })}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Stack>
            )}
          </Box>
        )}

        {/* Gateway Condition Tab */}
        {tabValue === 1 && elementType === 'bpmn:ExclusiveGateway' && (
          <Box sx={{ p: 2 }}>
            <TextField
              label="Koşul İfadesi"
              value={businessObject?.['custom:expression'] || ''}
              onChange={(e) => updateElementProperties({
                ...businessObject,
                expression: e.target.value
              })}
              multiline
              rows={3}
              fullWidth
              placeholder="vars.amount > 1000"
              helperText="Değişkenlere vars.fieldName şeklinde erişebilirsiniz"
              data-testid="gateway-expression"
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Main Canvas */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Toolbar */}
        <Paper sx={{ 
          p: 1, 
          mb: 1, 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center',
          background: 'var(--background)',
          border: '1px solid var(--border)'
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            BPMN Designer
          </Typography>
          
          <Button
            onClick={() => setPaletteCollapsed(!paletteCollapsed)}
            startIcon={<MenuIcon />}
            variant="outlined"
            size="small"
            sx={{ minWidth: 'auto' }}
            title={paletteCollapsed ? "Palette'i Göster" : "Palette'i Gizle"}
          >
            Palette
          </Button>
          
          <Button
            onClick={handleSave}
            startIcon={<SaveIcon />}
            variant="outlined"
            data-testid="save-bpmn"
          >
            Taslak Kaydet
          </Button>
          
          <Button
            onClick={() => setPublishDialogOpen(true)}
            startIcon={<PublishIcon />}
            variant="contained"
            data-testid="publish-bpmn"
          >
            Yayınla
          </Button>

          <IconButton
            onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
            color={propertiesPanelOpen ? 'primary' : 'default'}
            data-testid="toggle-properties"
          >
            <SettingsIcon />
          </IconButton>
        </Paper>

        {/* BPMN Canvas */}
        <Box 
          ref={containerRef} 
          sx={{ 
            height: 'calc(100vh - 80px)',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            '& .djs-palette': {
              display: paletteCollapsed ? 'none' : 'block',
              transition: 'all 0.3s ease-in-out'
            },
            '& .djs-palette .entry': {
              position: 'relative',
              '&:hover::after': {
                content: 'attr(data-tooltip)',
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                marginLeft: '8px'
              }
            }
          }}
          data-testid="bpmn-canvas"
        >
          {paletteCollapsed && (
            <Paper
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 100,
                p: 1,
                background: 'var(--background)',
                border: '1px solid var(--border)'
              }}
            >
              <IconButton
                onClick={() => setPaletteCollapsed(false)}
                size="small"
                title="Palette'i Göster"
              >
                <MenuIcon />
              </IconButton>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Properties Panel */}
      {propertiesPanelOpen && (
        <Paper sx={{ width: 350, borderLeft: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Properties
          </Typography>
          
          {selectedElement ? (
            renderPropertiesPanel()
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>
                Özellikleri görüntülemek için bir element seçin
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Workflow'u Yayınla</DialogTitle>
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
            data-testid="bpmn-changelog"
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setPublishDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handlePublish}
              variant="contained"
              disabled={!changelog.trim()}
              data-testid="confirm-bpmn-publish"
            >
              Yayınla
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BpmnDesigner;