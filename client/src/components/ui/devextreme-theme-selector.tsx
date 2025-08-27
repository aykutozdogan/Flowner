
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { useDevExtremeTheme } from '@/hooks/use-devextreme-theme';

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
      id: 'dark-violet', 
      name: 'Dark Violet', 
      color: '#6c5ce7',
      description: 'Dark Violet - Derin mor tonları'
    },
    { 
      id: 'green-mist', 
      name: 'Green Mist', 
      color: '#00b894',
      description: 'Green Mist - Ferah yeşil'
    },
    { 
      id: 'contrast', 
      name: 'Contrast', 
      color: '#2d3436',
      description: 'Contrast - Yüksek kontrast'
    },
    { 
      id: 'corporate', 
      name: 'Corporate', 
      color: '#1976d2',
      description: 'Corporate - Kurumsal Material Design'
    },
  ];

  const currentTheme = themes.find(t => t.id === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 transition-all hover:bg-primary/10"
          title="DevExtreme Tema Seç"
          data-testid="devextreme-theme-selector"
        >
          <Palette className="h-4 w-4 mr-2" />
          <div 
            className="w-3 h-3 rounded-full mr-2 border border-gray-300"
            style={{ backgroundColor: currentTheme?.color }}
          />
          <span className="hidden sm:inline">{currentTheme?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>DevExtreme Temalar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themes.map((themeOption) => (
          <DropdownMenuItem 
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id as any)}
            className="flex items-center space-x-3 p-3 cursor-pointer"
          >
            <div 
              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: themeOption.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium">{themeOption.name}</span>
                {theme === themeOption.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {themeOption.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
