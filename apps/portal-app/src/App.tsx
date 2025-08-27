import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { PortalLayout } from './components/PortalLayout';
import { DevExtremeThemeProvider } from './components/DevExtremeThemeProvider';
import 'devextreme/dist/css/dx.light.css';

const Tasks = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Görevlerim
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Atanmış görevlerin listesi ve işlem sayfası
    </p>
  </div>
);

const MyProcesses = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Süreçlerim
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Başlattığım ve takip ettiğim süreçlerin listesi
    </p>
  </div>
);

const StartProcess = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Yeni Süreç Başlat
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Mevcut workflow'lardan yeni süreç başlatma
    </p>
  </div>
);

const Forms = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Formlarım
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Doldurulacak ve gönderilen formların listesi
    </p>
  </div>
);

const Notifications = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Bildirimler
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Sistem bildirimleri ve mesajlar
    </p>
  </div>
);

const Profile = () => (
  <div style={{ padding: '24px' }}>
    <h2 style={{ color: '#4caf50', marginBottom: '16px' }}>
      Profil
    </h2>
    <p style={{ fontSize: '16px', lineHeight: '1.5' }}>
      Kullanıcı profil bilgileri ve ayarları
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
        <PortalLayout>
          <Switch>
            <Route path="/" component={Tasks} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/my-processes" component={MyProcesses} />
            <Route path="/start-process" component={StartProcess} />
            <Route path="/forms" component={Forms} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </PortalLayout>
      </Router>
    </DevExtremeThemeProvider>
  );
}

export default App;