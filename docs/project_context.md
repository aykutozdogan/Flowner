# Flowner Project Context

## Proje Özeti
- **Platform**: Business Process Management (BPM) - Multi-tenant BPMN workflow platform
- **Tech Stack**: Node.js/Express backend, React/TypeScript frontend, PostgreSQL/Drizzle ORM
- **Architecture**: Monorepo with unified client app + separate admin/portal entry points
- **Database**: PostgreSQL with Neon serverless, Drizzle ORM for type-safe queries

## Dosya Yapısı
```
flowner/
├── client/src/                  # Frontend monolith (React/TypeScript)
│   ├── components/              # Reusable React components
│   │   ├── layout/             # AdminSidebar, PortalSidebar, Header
│   │   ├── forms/              # FormRenderer, FormBuilder
│   │   ├── ui/                 # shadcn/ui + DevExtreme wrappers
│   │   └── workflows/          # BpmnDesigner
│   ├── pages/                  # Route-based pages
│   │   ├── admin/              # Admin panel pages (8 files)
│   │   └── portal/             # Portal user pages (7 files)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and API client
│   └── styles/                 # SCSS themes (light/dark/DevExtreme)
├── server/                     # Express.js backend API
├── shared/                     # Shared types and schemas
├── apps/                       # Legacy separate apps (being unified)
├── docs/                       # Project documentation
└── tests/                      # Test suites and logs
```

## Ana Dizinler
- **client/src/**: React frontend monolith - 110 TypeScript component files
- **server/**: Express.js API with authentication, workflow engine, storage
- **apps/**: Legacy admin-app (5174) and portal-app (5175) - being deprecated
- **shared/**: Drizzle schemas and shared TypeScript types
- **docs/**: Sprint reports and architecture documentation

## Konfigürasyon Dosyaları
- **package.json**: Monorepo workspace with 103 dependencies including MUI + DevExtreme
- **vite.config.ts**: Build configuration serving frontend + backend on same port
- **tsconfig.json**: TypeScript strict mode configuration
- **drizzle.config.ts**: Database migrations and schema management

## Port Yapısı
- **5000**: Main unified application (Vite dev server + Express backend)
- **5174**: Legacy admin-app (being phased out)
- **5175**: Legacy portal-app (being phased out)

## Dependencies Analysis
- **Frontend Framework**: React 18.3.1 with TypeScript 5.6.3
- **UI Libraries**: Material-UI 7.3.1 + DevExtreme 25.1.4 (hybrid state)
- **State Management**: TanStack Query 5.85.5 for server state
- **Routing**: Wouter 3.3.5 for client-side routing
- **Styling**: Tailwind CSS + SCSS + DevExtreme themes

## Current Architecture Status
- **Unified Client**: ✅ Single React app serving both admin and portal
- **Role-based Routing**: ✅ Admin/portal routes based on user roles
- **Backend API**: ✅ Express.js with JWT auth and multi-tenant support
- **Database**: ✅ PostgreSQL with proper schema versioning