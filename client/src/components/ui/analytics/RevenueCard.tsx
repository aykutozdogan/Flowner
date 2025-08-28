import React from 'react';
// Temporarily disabled DevExtreme Chart until we fix import issues
// import Chart, {
//   AreaSeries,
//   ArgumentAxis,
//   ValueAxis,
//   Legend,
//   Export,
//   Tooltip
// } from 'devextreme-react/chart';

interface RevenueData {
  date: string;
  revenue: number;
  profit: number;
}

interface RevenueCardProps {
  title?: string;
  data: RevenueData[];
  totalRevenue: number;
  totalProfit: number;
  percentageChange: number;
  className?: string;
}

export function RevenueCard({
  title = 'Revenue Analysis',
  data,
  totalRevenue,
  totalProfit,
  percentageChange,
  className = ''
}: RevenueCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTrendColor = () => {
    return percentageChange >= 0 ? 'var(--success-color)' : 'var(--error-color)';
  };

  const getTrendIcon = () => {
    return percentageChange >= 0 ? '↗' : '↘';
  };

  return (
    <div
      className={`revenue-card ${className}`}
      style={{
        backgroundColor: 'var(--background-color)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        height: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-color)',
            margin: '0 0 8px 0'
          }}
        >
          {title}
        </h3>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-color)',
                margin: '0 0 4px 0'
              }}
            >
              {formatCurrency(totalRevenue)}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-color-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Total Revenue
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-color-secondary)',
                margin: '0 0 4px 0'
              }}
            >
              {formatCurrency(totalProfit)}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-color-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Profit
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: getTrendColor(),
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{getTrendIcon()}</span>
              {Math.abs(percentageChange)}%
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-color-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              vs Last Month
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Temporarily showing static preview */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'var(--background-color-secondary)',
            borderRadius: '8px',
            border: '2px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              color: 'var(--primary-color)'
            }}
          >
            📊
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-color)',
              textAlign: 'center'
            }}
          >
            Premium DevExtreme Chart
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-color-secondary)',
              textAlign: 'center',
              maxWidth: '300px'
            }}
          >
            Professional revenue analytics chart would be displayed here with real-time data visualization
          </div>
        </div>
      </div>
    </div>
  );
}