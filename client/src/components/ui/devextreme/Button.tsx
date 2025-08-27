import React from 'react';
import { Button as DxButton, ButtonTypes } from 'devextreme-react/button';

interface FlowerButtonProps extends ButtonTypes.Properties {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'small' | 'normal' | 'large';
  'data-testid'?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'normal',
  stylingMode = 'contained',
  type = 'normal',
  'data-testid': testId,
  ...props 
}: FlowerButtonProps) {
  
  // Map variants to DevExtreme types
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'normal';
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  // Map sizes to width/height
  const getButtonStyle = () => {
    switch (size) {
      case 'small':
        return { height: 32, minWidth: 80 };
      case 'large':
        return { height: 48, minWidth: 120 };
      case 'normal':
      default:
        return { height: 40, minWidth: 100 };
    }
  };

  const buttonStyle = {
    ...getButtonStyle(),
    fontFamily: 'Roboto, sans-serif',
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
  };

  return (
    <DxButton
      text={typeof children === 'string' ? children : undefined}
      type={getButtonType()}
      stylingMode={stylingMode}
      elementAttr={{
        'data-testid': testId,
        style: buttonStyle
      }}
      {...props}
    >
      {typeof children !== 'string' ? children : undefined}
    </DxButton>
  );
}

export default Button;