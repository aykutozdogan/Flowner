// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'tenant_admin' | 'designer' | 'approver' | 'user';
  tenant_id: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    access_token: string;
    user: User;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface FormField {
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    message?: string;
  };
  options?: string[];
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}

export interface Form {
  id: string;
  key: string;
  name: string;
  schema_json: FormSchema;
  ui_schema_json: any;
  version: number;
  status: 'draft' | 'published';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Workflow types
export interface Workflow {
  id: string;
  key: string;
  name: string;
  xml: string;
  dsl_json: any;
  version: number;
  status: 'draft' | 'published';
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Process types
export interface ProcessInstance {
  id: string;
  workflow_key: string;
  workflow_version: number;
  status: 'running' | 'completed' | 'failed' | 'suspended';
  variables: Record<string, any>;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Task types
export interface TaskInstance {
  id: string;
  process_id: string;
  task_key: string;
  name: string;
  status: 'created' | 'assigned' | 'in_progress' | 'completed';
  assignee_id?: string;
  assignee_role?: string;
  form_key?: string;
  form_data?: Record<string, any>;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: Record<string, any>;
  branding: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}