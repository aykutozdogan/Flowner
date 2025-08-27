import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { AdminLayout } from './components/AdminLayout';
import { DevExtremeThemeProvider } from './components/DevExtremeThemeProvider';
import 'devextreme/dist/css/dx.light.css';

const Dashboard = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Admin Dashboard
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Flowner Admin Panel - Forms, Workflows, Tenants, Users yönetimi
    </p>
  </div>
);

const Forms = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Forms Management
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Form oluşturma ve yönetim sayfası
    </p>
  </div>
);

const Workflows = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Workflows Management
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      BPMN Workflow oluşturma ve yönetim sayfası
    </p>
  </div>
);

const FormBuilder = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Form Builder
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Drag & drop form builder interface
    </p>
  </div>
);

const Users = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Kullanıcı Yönetimi
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Kullanıcılar ve roller yönetimi
    </p>
  </div>
);

const Tenants = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
      Tenant Yönetimi
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Çok kiracılı yapı yönetimi
    </p>
  </div>
);

const NotFound = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#f44336' }}>404 - Sayfa Bulunamadı</h2>
    <p>Aradığınız sayfa mevcut değil.</p>
  </div>
);

function App() {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <DevExtremeThemeProvider>
      <Router>
        <AdminLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/forms" component={Forms} />
            <Route path="/forms/builder" component={FormBuilder} />
            <Route path="/workflows" component={Workflows} />
            <Route path="/workflows/designer" component={Workflows} />
            <Route path="/users" component={Users} />
            <Route path="/tenants" component={Tenants} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Router>
    </DevExtremeThemeProvider>
  );
}

export default App;