import React, { useEffect } from 'react';

function AdminApp() {
  useEffect(() => {
    // Admin entry point - redirect to main app with admin mode
    const currentUrl = new URL(window.location.href);
    const mainAppUrl = `http://localhost:5000/admin${currentUrl.search}`;
    
    // Iframe approach for now - cleaner separation
    const iframe = document.createElement('iframe');
    iframe.src = mainAppUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    
    document.body.innerHTML = '';
    document.body.appendChild(iframe);
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#1976d2', marginBottom: '16px' }}>
          🚀 Flowner Admin Panel
        </h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Yükleniyorlar...
        </p>
      </div>
    </div>
  );
}

export default AdminApp;