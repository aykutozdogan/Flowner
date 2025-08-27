import React from 'react';
import { Form as DxForm, SimpleItem, GroupItem, FormTypes } from 'devextreme-react/form';

interface FlowerFormProps extends FormTypes.Properties {
  children?: React.ReactNode;
  'data-testid'?: string;
}

export function Form({ 
  children,
  'data-testid': testId,
  ...props 
}: FlowerFormProps) {
  
  return (
    <DxForm
      {...props}
      elementAttr={{
        'data-testid': testId,
        class: 'flowner-form'
      }}
      labelLocation="left"
      minColWidth={300}
      colCount={1}
      showValidationSummary={true}
    >
      {children}
    </DxForm>
  );
}

export { SimpleItem as FormItem, GroupItem as FormGroup };
export default Form;