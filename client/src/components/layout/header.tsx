import { 
  TextBox as DxTextBox,
  Button as DxButton 
} from 'devextreme-react';
import { Search, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function Header({ title = "Dashboard", breadcrumbs = [{ label: "Home" }, { label: "Dashboard" }] }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header style={{
      backgroundColor: 'var(--bg-primary, #ffffff)',
      borderBottom: '1px solid var(--border-color, #e0e0e0)',
      padding: '16px 24px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left side - Title and Breadcrumbs */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px' 
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--text-primary, #1976d2)',
          margin: 0
        }}>
          {title}
        </h1>
        
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              {index > 0 && (
                <ChevronRight 
                  size={14} 
                  style={{ 
                    color: 'var(--text-secondary, #666)', 
                    margin: '0 8px' 
                  }} 
                />
              )}
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: index === breadcrumbs.length - 1 ? '500' : '400',
                  color: index === breadcrumbs.length - 1 
                    ? 'var(--text-primary, #333)' 
                    : 'var(--text-secondary, #666)',
                  cursor: crumb.href ? 'pointer' : 'default',
                  textDecoration: crumb.href && index < breadcrumbs.length - 1 ? 'underline' : 'none'
                }}
                onClick={() => crumb.href && (window.location.href = crumb.href)}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right side - Search and Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '320px' }}>
          <DxTextBox
            placeholder="Search processes, forms..."
            value={searchQuery}
            onValueChanged={(e) => setSearchQuery(e.value)}
            height={36}
            stylingMode="outlined"
            elementAttr={{
              style: {
                backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                borderColor: 'var(--border-color, #e0e0e0)'
              }
            }}
          >
            <div slot="buttons">
              <Search 
                size={20} 
                style={{ 
                  color: 'var(--text-secondary, #666)',
                  marginLeft: '8px'
                }} 
              />
            </div>
          </DxTextBox>
        </div>

        {/* Action Buttons */}
        <DxButton
          icon="bell"
          stylingMode="text"
          hint="Bildirimler"
          height={36}
          width={36}
          elementAttr={{
            style: {
              color: 'var(--text-secondary, #666)'
            }
          }}
        />

        <DxButton
          icon="help"
          stylingMode="text"
          hint="Yardım"
          height={36}
          width={36}
          elementAttr={{
            style: {
              color: 'var(--text-secondary, #666)'
            }
          }}
        />
      </div>
    </header>
  );
}