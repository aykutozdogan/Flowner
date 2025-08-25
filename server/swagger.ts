import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flowner API',
      version: '1.0.0',
      description: 'BPMN Workflow Engine REST API Documentation',
      contact: {
        name: 'Flowner Support',
        email: 'support@flowner.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        tenantId: {
          name: 'X-Tenant-Id',
          in: 'header',
          required: true,
          description: 'Tenant domain identifier',
          schema: {
            type: 'string',
            example: 'example-company'
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              example: '/api/errors/validation'
            },
            title: {
              type: 'string',
              example: 'Validation Error'
            },
            status: {
              type: 'integer',
              example: 400
            },
            detail: {
              type: 'string',
              example: 'The request contains invalid data'
            },
            errors: {
              type: 'object',
              description: 'Field-specific validation errors'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                access_token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refresh_token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                expires_in: {
                  type: 'integer',
                  example: 3600
                },
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: 'usr_123456'
                    },
                    email: {
                      type: 'string',
                      example: 'user@example.com'
                    },
                    name: {
                      type: 'string',
                      example: 'John Doe'
                    },
                    role: {
                      type: 'string',
                      enum: ['tenant_admin', 'designer', 'approver', 'user'],
                      example: 'user'
                    },
                    tenant_id: {
                      type: 'string',
                      example: 'tnt_123456'
                    }
                  }
                }
              }
            }
          }
        },
        RefreshRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: 'usr_123456'
                },
                email: {
                  type: 'string',
                  example: 'user@example.com'
                },
                name: {
                  type: 'string',
                  example: 'John Doe'
                },
                role: {
                  type: 'string',
                  enum: ['tenant_admin', 'designer', 'approver', 'user'],
                  example: 'user'
                },
                tenant: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: 'tnt_123456'
                    },
                    name: {
                      type: 'string',
                      example: 'Example Company'
                    },
                    domain: {
                      type: 'string',
                      example: 'example-company'
                    }
                  }
                },
                permissions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: []
                }
              }
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-25T15:07:32.123Z'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'healthy'
                    },
                    response_time: {
                      type: 'string',
                      example: '12ms'
                    }
                  }
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'healthy'
                    },
                    response_time: {
                      type: 'string',
                      example: '3ms'
                    }
                  }
                },
                queue: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'healthy'
                    },
                    pending_jobs: {
                      type: 'integer',
                      example: 5
                    }
                  }
                }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                uptime: {
                  type: 'string',
                  example: '72h 15m'
                },
                memory_usage: {
                  type: 'string',
                  example: '67%'
                },
                cpu_usage: {
                  type: 'string',
                  example: '23%'
                }
              }
            }
          }
        },
        Process: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'proc_123456'
            },
            name: {
              type: 'string',
              example: 'Expense Approval Process'
            },
            workflow_id: {
              type: 'string',
              example: 'wfl_123456'
            },
            status: {
              type: 'string',
              enum: ['running', 'completed', 'cancelled', 'failed'],
              example: 'running'
            },
            variables: {
              type: 'object',
              example: {
                amount: 1500,
                requestor: 'John Doe'
              }
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-25T15:07:32.123Z'
            },
            started_by: {
              type: 'string',
              example: 'usr_123456'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'task_123456'
            },
            name: {
              type: 'string',
              example: 'Approve Expense'
            },
            description: {
              type: 'string',
              example: 'Review and approve the expense request'
            },
            process_id: {
              type: 'string',
              example: 'proc_123456'
            },
            assignee_id: {
              type: 'string',
              nullable: true,
              example: 'usr_123456'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled'],
              example: 'pending'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high'],
              example: 'normal'
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-01-30T15:07:32.123Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-25T15:07:32.123Z'
            }
          }
        },
        Form: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'frm_123456'
            },
            name: {
              type: 'string',
              example: 'Expense Request Form'
            },
            description: {
              type: 'string',
              example: 'Form for submitting expense requests'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              example: 'published'
            },
            fields_count: {
              type: 'integer',
              example: 5
            },
            submissions_count: {
              type: 'integer',
              example: 25
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-25T15:07:32.123Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-25T15:07:32.123Z'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server/routes.ts'], // Path to the API files
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };