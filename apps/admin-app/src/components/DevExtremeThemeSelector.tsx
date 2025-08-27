import React from 'react';
import { DropDownButton } from 'devextreme-react';
import { useDevExtremeTheme } from './DevExtremeThemeProvider';

export function DevExtremeThemeSelector() {
  const { theme, setTheme } = useDevExtremeTheme();

  const themes = [
    { 
      id: 'light', 
      name: 'Light', 
      color: '#74b9ff',
      description: 'Açık tema - Klasik beyaz arkaplan'
    },
    { 
      id: 'dark', 
      name: 'Dark', 
      color: '#2d3436',
      description: 'Koyu tema - Göz dostu karanlık mod'
    },
    { 
      id: 'carmine', 
      name: 'Carmine', 
      color: '#e17055',
      description: 'Carmine - Sıcak kırmızı tonları'
    },
    { 
      id: 'dark-moon', 
      name: 'Dark Moon', 
      color: '#00b894',
      description: 'Dark Moon - Gece mavisi'
    },
    { 
      id: 'soft-blue', 
      name: 'Soft Blue', 
      color: '#74b9ff',
      description: 'Soft Blue - Yumuşak mavi tonlar'
    },
    { 
      id: 'corporate', 
      name: 'Corporate', 
      color: '#1976d2',
      description: 'Corporate - Kurumsal Material Design'
    },
  ];

  const currentTheme = themes.find(t => t.id === theme);

  const themeItems = themes.map(t => ({
    text: t.name,
    color: t.color,
    description: t.description,
    onClick: () => setTheme(t.id as any)
  }));

  return (
    <DropDownButton
      text={currentTheme?.name || 'Light'}
      icon="palette"
      items={themeItems}
      displayExpr="text"
      keyExpr="text"
      stylingMode="text"
      dropDownOptions={{
        width: 250
      }}
      hint="DevExtreme Tema Seç"
    />
  );
}