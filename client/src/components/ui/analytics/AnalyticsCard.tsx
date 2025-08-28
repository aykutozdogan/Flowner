import React from 'react';
import { Card } from 'devextreme-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  percentage?: number;
  percentageText?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function AnalyticsCard({
  title,
  value,
  percentage,
  percentageText,
  trend = 'neutral',
  icon,
  color = 'primary',
  className = ''
}: AnalyticsCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'border-l-4 border-l-green-500';
      case 'warning':
        return 'border-l-4 border-l-yellow-500';
      case 'error':
        return 'border-l-4 border-l-red-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div
      className={`analytics-card ${getColorClasses()} ${className}`}
      style={{
        backgroundColor: 'var(--background-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-color)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-color-secondary)',
              margin: '0 0 8px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </h3>
          
          <div
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text-color)',
              margin: '0 0 8px 0',
              lineHeight: '1.2'
            }}
          >
            {value}
          </div>

          {(percentage !== undefined || percentageText) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className={getTrendColor()} style={{ fontSize: '14px', fontWeight: '600' }}>
                {getTrendIcon()}
                {percentage !== undefined && ` ${Math.abs(percentage)}%`}
              </span>
              {percentageText && (
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-color-secondary)'
                  }}
                >
                  {percentageText}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `var(--${color}-color, var(--primary-color))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              opacity: 0.9
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}