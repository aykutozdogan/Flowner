import React from 'react';
import { TextBox as DxTextBox, TextBoxTypes } from 'devextreme-react/text-box';

interface FlowerTextBoxProps extends TextBoxTypes.Properties {
  label?: string;
  required?: boolean;
  'data-testid'?: string;
}

export function TextBox({ 
  label,
  required = false,
  'data-testid': testId,
  ...props 
}: FlowerTextBoxProps) {
  
  return (
    <div className="flowner-text-box-container">
      {label && (
        <label className="flowner-text-box-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <DxTextBox
        {...props}
        elementAttr={{
          'data-testid': testId,
          class: 'flowner-text-box'
        }}
        height={40}
        stylingMode="outlined"
        showClearButton={true}
      />
    </div>
  );
}

export default TextBox;