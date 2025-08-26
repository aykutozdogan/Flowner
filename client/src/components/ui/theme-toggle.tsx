import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Building2 } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const themeConfig = {
    light: { icon: Sun, label: 'Açık Tema', next: 'dark' },
    dark: { icon: Moon, label: 'Koyu Tema', next: 'corporate' },
    corporate: { icon: Building2, label: 'Kurumsal Tema', next: 'light' }
  };

  const current = themeConfig[theme];
  const IconComponent = current.icon;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 transition-all hover:bg-primary/10"
      title={`${current.label} (Şu anda: ${current.label.toLowerCase()})`}
      data-testid="theme-toggle-button"
    >
      <IconComponent className="h-4 w-4" />
      <span className="sr-only">Tema değiştir</span>
    </Button>
  );
}