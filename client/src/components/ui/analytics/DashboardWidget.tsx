import React from 'react';
import { AnalyticsCard } from './AnalyticsCard';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Activity } from 'lucide-react';

interface DashboardWidgetProps {
  className?: string;
}

interface WidgetData {
  title: string;
  value: string | number;
  percentage: number;
  percentageText: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
}

export function DashboardWidget({ className = '' }: DashboardWidgetProps) {
  // Simulated real-time data
  const widgetData: WidgetData[] = [
    {
      title: 'Total Revenue',
      value: '₺245,670',
      percentage: 12.5,
      percentageText: 'vs last month',
      trend: 'up',
      icon: <DollarSign size={24} />,
      color: 'primary'
    },
    {
      title: 'Active Users',
      value: '8,549',
      percentage: 8.2,
      percentageText: 'vs last week',
      trend: 'up',
      icon: <Users size={24} />,
      color: 'success'
    },
    {
      title: 'Total Orders',
      value: '1,423',
      percentage: -3.1,
      percentageText: 'vs yesterday',
      trend: 'down',
      icon: <ShoppingCart size={24} />,
      color: 'warning'
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      percentage: 5.7,
      percentageText: 'vs last month',
      trend: 'up',
      icon: <Activity size={24} />,
      color: 'success'
    }
  ];

  return (
    <div className={`dashboard-widget ${className}`}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          padding: '0'
        }}
      >
        {widgetData.map((widget, index) => (
          <AnalyticsCard
            key={index}
            title={widget.title}
            value={widget.value}
            percentage={widget.percentage}
            percentageText={widget.percentageText}
            trend={widget.trend}
            icon={widget.icon}
            color={widget.color}
            className="dashboard-widget-card"
          />
        ))}
      </div>
    </div>
  );
}

// Professional Theme Switcher Component 
interface ThemeSwitcherProps {
  onThemeChange?: (theme: 'light' | 'dark' | 'corporate') => void;
  className?: string;
}

export function ThemeSwitcher({ onThemeChange, className = '' }: ThemeSwitcherProps) {
  return (
    <div
      className={`theme-switcher ${className}`}
      style={{
        backgroundColor: 'var(--background-color)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}
    >
      <span
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-color-secondary)',
          marginRight: '8px'
        }}
      >
        Theme:
      </span>
      
      {(['light', 'dark', 'corporate'] as const).map((theme) => (
        <button
          key={theme}
          onClick={() => onThemeChange?.(theme)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--background-color-secondary)',
            color: 'var(--text-color)',
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'capitalize',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-color)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--background-color-secondary)';
            e.currentTarget.style.color = 'var(--text-color)';
          }}
        >
          {theme}
        </button>
      ))}
    </div>
  );
}