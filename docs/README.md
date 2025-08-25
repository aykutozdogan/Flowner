# Flowner - Business Process Management Platform

Flowner is a multi-tenant BPMN-based business process management platform that enables organizations to design, deploy, and manage their business workflows through an intuitive web interface.

## 🎯 Project Vision

**Tek platformdan tüm süreç ve formları tanımlayıp çalıştırmak**

Create a unified platform where all business processes and forms can be defined and executed from a single interface, targeting internal users with comprehensive workflow automation capabilities.

## 🏗️ Architecture Overview

Flowner follows a 3-tier architecture:

1. **Backend** (Node.js + TypeScript + Express + PostgreSQL)
   - Multi-tenant architecture with strict data isolation
   - JWT-based authentication with RBAC (4 roles)
   - BPMN workflow engine with background processing
   - RESTful API with OpenAPI documentation

2. **Admin Panel** (React + Material-UI)
   - Drag-and-drop form designer
   - Visual BPMN workflow designer  
   - User and tenant management
   - Process monitoring and analytics

3. **User Portal** (React PWA)
   - Task inbox and process initiation
   - Form completion and approval workflows
   - Offline capabilities with IndexedDB
   - Push notifications

## 🚀 Key Features

### MVP Features (Current Sprint)
- ✅ Multi-tenant data isolation
- ✅ Form definition and management
- ✅ Basic BPMN workflow engine (Start/End, User Task, Service Task, Gateways)
- ✅ User authentication and RBAC
- ✅ API integration capabilities
- ✅ File upload and management

### Planned Features
- Advanced BPMN elements (Timer events, Sub-processes)
- Real-time collaboration on form/workflow design
- Advanced analytics and reporting
- Mobile applications
- Third-party integrations (ERP, CRM, SSO)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20.x + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Logging**: pino (JSON structured)
- **Monitoring**: OpenTelemetry
- **Queue**: BullMQ + Redis
- **File Storage**: S3-compatible storage

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI v5
- **Routing**: wouter
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **PWA**: Service Workers + IndexedDB

### DevOps
- **CI/CD**: GitHub Actions
- **Containers**: Docker + docker-compose
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + React Testing Library

## 📋 Sprint Plan

The project follows a 7-sprint development approach:

- **S0** - Documentation & Architecture
- **S1** - Backend Foundation
- **S2** - BPMN Engine MVP
- **S3** - Admin Panel
- **S4** - User Portal
- **S5** - Integration & Glue
- **S6** - CI/CD & Deployment

See [Sprint Plan](./sprint-plan.md) for detailed breakdown.

## 🔧 Development Setup

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher (for production)

### Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd flowner
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and other configurations
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:5000/api
   - API Documentation: http://localhost:5000/api/docs

## 🏢 Multi-Tenant Architecture

Flowner implements a single-database multi-tenancy model:

- **Tenant Isolation**: All data tables include `tenant_id` column
- **Row-Level Security**: PostgreSQL RLS policies enforce tenant boundaries
- **API Security**: X-Tenant-Id header validation on all requests
- **Cache Isolation**: Redis keys prefixed with tenant ID
- **File Storage**: S3 paths organized by tenant

## 🔐 Security Features

- **Authentication**: JWT access tokens (60min) + refresh tokens (7 days)
- **Authorization**: Role-based access control (RBAC)
- **Multi-tenancy**: Strict tenant data isolation
- **API Security**: Rate limiting, CORS, input validation
- **Data Protection**: At-rest encryption, audit logging

## 🤝 Contributing

1. Follow the sprint plan and acceptance criteria
2. All code must include comprehensive tests
3. Use conventional commits for version control
4. Ensure all linting and formatting checks pass
5. Update documentation for new features

## 📄 License

This project is proprietary software. All rights reserved.

---

For detailed technical documentation, see the [Architecture Guide](./architecture.md).
