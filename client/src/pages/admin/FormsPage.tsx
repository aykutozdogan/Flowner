import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button as DxButton } from 'devextreme-react/button';
import DataGrid, { 
  Column,
  Paging,
  Pager,
  HeaderFilter,
  FilterRow,
  SearchPanel
} from 'devextreme-react/data-grid';
import { Plus, Edit, Eye, Upload } from 'lucide-react';

interface Form {
  id: string;
  key: string;
  name: string;
  description: string;
  latest_version: number;
  status: 'draft' | 'published' | 'archived';
  updated_at: string;
  created_at: string;
  tenant_id: string;
}

const STATUS_LABELS = {
  draft: 'Taslak',
  published: 'Yayında',
  archived: 'Arşivlendi'
} as const;

const STATUS_COLORS = {
  draft: 'warning',
  published: 'success',
  archived: 'default'
} as const;

export default function FormsPage() {
  const [, setLocation] = useLocation();

  // Fetch forms
  const { data: forms, isLoading, error } = useQuery({
    queryKey: ['/api/v1/forms'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('tenant_domain') || 'demo.local';
      
      const response = await fetch('/api/v1/forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data;
    },
  });

  const handleNewForm = () => {
    setLocation('/form-builder');
  };

  const handleEditForm = (formKey: string) => {
    setLocation(`/form-builder/${formKey}`);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          padding: '16px', 
          borderRadius: '4px',
          color: '#c33'
        }}>
          Formlar yüklenirken hata oluştu: {(error as any)?.message}
        </div>
      </div>
    );
  }

  // Prepare data for DevExtreme DataGrid
  const formData = forms?.map((form: Form) => ({
    id: form.id,
    key: form.key,
    name: form.name,
    description: form.description || '-',
    latest_version: `v${form.latest_version}`,
    status: STATUS_LABELS[form.status],
    statusKey: form.status,
    updated_at: new Date(form.updated_at).toLocaleDateString('tr-TR'),
    actions: form.key
  })) || [];

  return (
    <div style={{ padding: '24px', backgroundColor: 'transparent' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '500', 
          margin: 0,
          color: '#1976d2'
        }}>
          Form Yönetimi
        </h1>
        
        <DxButton
          text="Yeni Form"
          icon="plus"
          type="default"
          stylingMode="contained"
          onClick={handleNewForm}
          elementAttr={{ 'data-testid': 'button-new-form' }}
        />
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <DataGrid
          dataSource={formData}
          showBorders={true}
          showRowLines={true}
          showColumnLines={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          keyExpr="id"
          elementAttr={{ 'data-testid': 'forms-grid' }}
        >
          <Column 
            dataField="name"
            caption="Form Adı"
            cellRender={(cellData) => (
              <div style={{ fontWeight: '600', color: '#1976d2' }}>
                {cellData.value}
              </div>
            )}
          />
          <Column 
            dataField="key"
            caption="Anahtar"
            cellRender={(cellData) => (
              <div style={{ color: '#666', fontSize: '14px' }}>
                {cellData.value}
              </div>
            )}
          />
          <Column 
            dataField="description"
            caption="Açıklama"
            cellRender={(cellData) => (
              <div style={{ color: '#666', fontSize: '14px' }}>
                {cellData.value}
              </div>
            )}
          />
          <Column 
            dataField="latest_version"
            caption="Versiyon"
            width={100}
            alignment="center"
          />
          <Column 
            dataField="status"
            caption="Durum"
            width={120}
            alignment="center"
            cellRender={(cellData) => {
              const statusKey = cellData.data.statusKey;
              const statusColor = statusKey === 'published' ? '#2eb52c' : 
                                 statusKey === 'draft' ? '#f57c00' : '#969696';
              return (
                <div style={{
                  backgroundColor: statusColor,
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center',
                  display: 'inline-block',
                  minWidth: '80px'
                }}>
                  {cellData.value}
                </div>
              );
            }}
          />
          <Column 
            dataField="updated_at"
            caption="Son Güncelleme"
            width={150}
            alignment="center"
          />
          <Column 
            dataField="actions"
            caption="İşlemler"
            width={100}
            alignment="center"
            cellRender={(cellData) => (
              <DxButton
                icon="edit"
                stylingMode="text"
                hint="Düzenle"
                onClick={() => handleEditForm(cellData.value)}
                elementAttr={{ 'data-testid': `button-edit-form-${cellData.value}` }}
              />
            )}
          />

          <Paging defaultPageSize={20} />
          <Pager 
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50]}
            showInfo={true}
          />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <SearchPanel 
            visible={true}
            placeholder="Form ara..."
          />
        </DataGrid>

        {formData.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            color: '#666',
            fontSize: '16px'
          }}>
            Henüz form bulunmuyor
          </div>
        )}
      </div>
    </div>
  );
}