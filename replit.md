# Flowner - Business Process Management Platform

## Overview

Flowner is a multi-tenant BPMN-based business process management platform that enables organizations to design, deploy, and manage their business workflows through an intuitive web interface. The platform follows a unified approach where all business processes and forms can be defined and executed from a single interface, targeting internal users with comprehensive workflow automation capabilities.

The application implements a modern full-stack architecture with a Node.js/Express backend, React frontend components, and PostgreSQL database with Drizzle ORM for data persistence. The system is designed around a 3-tier architecture consisting of a backend API, an admin panel for process design, and a user portal for process execution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React 18 with TypeScript and follows a component-based architecture. The UI framework combines Material-UI (MUI) for core components with shadcn/ui components for enhanced functionality. The application uses wouter for lightweight routing and TanStack Query for server state management. Styling is handled through a combination of Tailwind CSS and Material-UI's theming system, with custom CSS variables for consistent design tokens.

The frontend is configured as a Progressive Web App (PWA) capable of offline functionality, with Vite as the build tool providing hot module replacement and optimized production builds. The component structure separates concerns between layout components (sidebar, header), dashboard widgets, and reusable UI components.

### Backend Architecture
The server-side implementation uses Node.js with Express.js providing the REST API layer. TypeScript is used throughout for type safety, with a clean separation between routing, business logic, and data access layers. The backend implements JWT-based authentication with role-based access control (RBAC) supporting four distinct roles: tenant_admin, designer, approver, and user.

The API follows RESTful conventions with standardized error handling using ProblemDetails format. Background processing is handled through job queues, and the system includes comprehensive logging and observability features. File storage capabilities support S3-compatible storage solutions with proper security measures.

### Database Design
The data layer uses PostgreSQL as the primary database with Drizzle ORM providing type-safe database operations. The schema implements strict multi-tenant data isolation using tenant_id fields across all tables. Core entities include tenants, users, forms, workflows, process instances, and task instances.

The database design supports version control for both forms and workflows, allowing for draft and published states while maintaining backward compatibility for active process instances. Audit logging is implemented across all critical operations for compliance and debugging purposes.

### BPMN Workflow Engine
The system includes a custom BPMN workflow engine supporting core elements: Start/End events, User Tasks, Service Tasks, and Exclusive/Parallel Gateways. Service Tasks can execute HTTP calls to external systems or internal C# handlers. User Tasks support form binding, role-based assignment, SLA tracking, and escalation workflows.

Process instances maintain their state through a dedicated state management system, with support for process suspension, cancellation, and completion tracking. The engine runs as a background service with job queue integration for reliable task execution.

### Security Implementation
Multi-tenant security is enforced at the database level with mandatory tenant_id validation on all operations. Authentication uses JWT tokens with refresh token rotation, and all API endpoints implement proper authorization checks. Rate limiting is applied per tenant and user to prevent abuse.

File uploads are secured with virus scanning capabilities, size limitations, and proper access controls. All sensitive data is encrypted at rest, and the system implements comprehensive audit logging for security monitoring.

### Caching and Performance
Redis is integrated for caching authentication tokens, user sessions, and frequently accessed data like published forms and workflows. The frontend implements optimistic updates and intelligent caching strategies through TanStack Query.

Database queries are optimized with proper indexing strategies, particularly for tenant-based filtering and process state queries. The system is designed to scale horizontally with stateless API servers and distributed caching.

## External Dependencies

### Database and Storage
- **PostgreSQL**: Primary database for all application data with multi-tenant isolation
- **Neon Database**: Cloud PostgreSQL provider with serverless capabilities
- **Redis**: Caching layer for sessions, tokens, and frequently accessed data
- **S3-Compatible Storage**: File attachment storage with MinIO or AWS S3 support

### Authentication and Security
- **JWT (jsonwebtoken)**: Token-based authentication with refresh token support
- **bcrypt**: Password hashing and verification
- **CORS middleware**: Cross-origin request security
- **Rate limiting**: API abuse prevention

### External Services Integration
- **Email Services**: SMTP integration for notifications and user communications
- **SMS Providers**: Optional SMS notifications for critical process events
- **OAuth Providers**: Google and Microsoft OAuth integration for SSO
- **Webhook Systems**: Outbound webhook support for external system integration

### Development and Monitoring
- **OpenTelemetry**: Distributed tracing and observability
- **Pino**: Structured JSON logging
- **Health Check Endpoints**: System monitoring and uptime verification
- **Error Tracking**: Application error monitoring and alerting

### Frontend Dependencies
- **Vite**: Build tool and development server with HMR
- **React Hook Form**: Form state management and validation
- **React Query**: Server state management and caching
- **Material-UI**: Primary component library and theming
- **Tailwind CSS**: Utility-first CSS framework
- **bpmn-js**: BPMN diagram visualization and editing capabilities

### Build and Deployment
- **Docker**: Containerization for consistent deployment environments
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **ESBuild**: Fast JavaScript bundling for production builds
- **TypeScript Compiler**: Type checking and transpilation

## Recent Changes

### S6 Sprint (25 Ağustos 2025) - Frontend Split & Production Infrastructure
- **Frontend Monorepo:** Tek uygulama → admin-app + portal-app + shared packages
- **Shared Packages:** shared-ui (components) ve shared-core (auth, API, RBAC)
- **Webhook Integration:** Event-driven webhooks with HMAC signature verification
- **API Key Management:** Secure API key generation, validation, and rate limiting
- **Observability:** Structured logging, metrics collection, request tracing
- **Production Ready:** CI/CD foundation, backup procedures, monitoring setup