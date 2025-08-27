import React from 'react';
import { DropDownButton as DxDropDownButton } from 'devextreme-react';
import { useDevExtremeTheme } from '@/hooks/use-devextreme-theme';

export function DevExtremeThemeSelector() {
  const { theme, setTheme } = useDevExtremeTheme();

  const themes = [
    { 
      id: 'light', 
      name: 'Light', 
      text: '☀️ Light',
      description: 'Açık tema - Klasik beyaz arkaplan'
    },
    { 
      id: 'dark', 
      name: 'Dark', 
      text: '🌙 Dark',
      description: 'Koyu tema - Göz dostu karanlık mod'
    },
    { 
      id: 'carmine', 
      name: 'Carmine', 
      text: '🔴 Carmine',
      description: 'Carmine - Sıcak kırmızı tonları'
    },
    { 
      id: 'dark-moon', 
      name: 'Dark Moon', 
      text: '🌚 Dark Moon',
      description: 'Dark Moon - Gece mavisi'
    },
    { 
      id: 'soft-blue', 
      name: 'Soft Blue', 
      text: '💙 Soft Blue',
      description: 'Soft Blue - Yumuşak mavi tonlar'
    },
    { 
      id: 'dark-violet', 
      name: 'Dark Violet', 
      text: '💜 Dark Violet',
      description: 'Dark Violet - Derin mor tonları'
    },
    { 
      id: 'green-mist', 
      name: 'Green Mist', 
      text: '💚 Green Mist',
      description: 'Green Mist - Ferah yeşil'
    },
    { 
      id: 'contrast', 
      name: 'Contrast', 
      text: '⚫ Contrast',
      description: 'Contrast - Yüksek kontrast'
    },
    { 
      id: 'corporate', 
      name: 'Corporate', 
      text: '🏢 Corporate',
      description: 'Corporate - Kurumsal Material Design'
    },
  ];

  const currentTheme = themes.find(t => t.id === theme);
  
  const handleThemeChange = (e: any) => {
    const selectedTheme = themes.find(t => t.text === e.itemData.text);
    if (selectedTheme) {
      setTheme(selectedTheme.id as any);
    }
  };

  return (
    <DxDropDownButton
      text={currentTheme?.text || '☀️ Light'}
      icon="palette"
      items={themes}
      displayExpr="text"
      keyExpr="text"
      stylingMode="text"
      onItemClick={handleThemeChange}
      dropDownOptions={{
        width: 250
      }}
      hint="DevExtreme Tema Seç"
    />
  );
}