# Flowner Mimari Dokümantasyonu

## Sistem Genel Bakış

Flowner, multi-tenant BPMN tabanlı iş süreç yönetimi platformudur. Tek platformdan form tasarımı, workflow tanımlama ve süreç yürütmeyi sağlar.

## 3 Parçalı Mimari

### 1. Backend (Node.js + TypeScript)

**Teknoloji Stack:**
- Node.js 20.x + TypeScript
- Express.js (REST API)
- Prisma ORM + PostgreSQL
- JWT Auth + RBAC (4 rol)
- pino (JSON logging) + OpenTelemetry
- Redis (cache/session) + BullMQ (queue)

**Sorumluluklar:**
- Multi-tenant veri izolasyonu (tenant_id zorunlu)
- Kullanıcı kimlik doğrulama ve yetkilendirme
- Form ve workflow sürüm yönetimi
- BPMN engine (background service)
- API gateway ve iş mantığı
- File storage (S3 uyumlu)
- Audit logging ve observability

**Port:** 3000 (development), 8080 (production)

### 2. Admin Panel (React + Material-UI)

**Teknoloji Stack:**
- React 18 + TypeScript
- Material-UI v5 + React Hook Form
- React Router v6 + Context API
- TanStack Query (state management)
- bpmn-js (BPMN designer)
- Drag-drop form builder

**Sorumluluklar:**
- Form tasarlayıcısı (drag-drop, field types, validation)
- BPMN workflow designer (görsel editör)
- Kullanıcı ve tenant yönetimi
- Süreç izleme ve raporlama
- Sistem konfigürasyonu
- Role-based menü görünürlüğü

**Port:** 3001 (development)

### 3. User Portal (React PWA)

**Teknoloji Stack:**
- React 18 + TypeScript + PWA
- Material-UI v5 (mobile-first)
- Service Worker (offline cache)
- IndexedDB (local storage)
- Push notifications

**Sorumluluklar:**
- Inbox (atanan görevler)
- Süreç başlatma (form doldurma)
- Görev onayı/reddi
- Dosya ekleri görüntüleme
- Bildirimler (in-app + push)
- Offline çalışma (read-only)

**Port:** 3002 (development)

## Veri Akışları

### Form Tasarım Akışı
```
Admin Panel → Backend API → Database
     ↓
Form Designer → Form Schema → Validation Rules
     ↓
Published Version → Redis Cache → Ready for Use
```

### Workflow Execution Akışı
```
User Portal → Start Process → Backend API
     ↓
BPMN Engine → Task Queue → Background Worker
     ↓
Task Assignment → Notification → User Inbox
     ↓
Task Completion → Next Step → Process Continues
```

### Authentication Akışı
```
Login Request → JWT Generation → Refresh Token
     ↓
API Request → JWT Validation → Role Check
     ↓
Tenant Validation → Resource Access → Response
```

## Multi-Tenant Stratejisi

### Tek Veritabanı Modeli
- **Yaklaşım:** Single DB + `tenant_id` kolonu
- **İzolasyon:** Row-level security (RLS)
- **Avantaj:** Kolay yönetim, düşük maliyet
- **Güvenlik:** Tüm sorgular tenant_id filtreli

### Tenant İzolasyonu Katmanları

**1. API Seviyesi:**
```typescript
// Her request'te X-Tenant-Id header zorunlu
req.headers['x-tenant-id'] → JWT'deki tenant ile doğrulama
```

**2. Database Seviyesi:**
```sql
-- Tüm tablolarda tenant_id kolonu
SELECT * FROM forms WHERE tenant_id = $1 AND is_deleted = false;
```

**3. Cache Seviyesi:**
```typescript
// Redis key'lerinde tenant prefix
const cacheKey = `tenant:${tenantId}:forms:${formId}`;
```

**4. File Storage:**
```
s3://bucket/tenants/{tenantId}/forms/{formId}/{fileName}
```

### Tenant Veri Modeli
```typescript
interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: TenantSettings;
  branding: TenantBranding;
  subscription: SubscriptionPlan;
  is_active: boolean;
  created_at: Date;
}
```

## Güvenlik Mimari

### Authentication (Kimlik Doğrulama)
- **JWT Access Token:** 60 dakika (HS256)
- **Refresh Token:** 7 gün (secure, httpOnly cookie)
- **OAuth 2.0:** Google + Microsoft entegrasyon
- **Password Policy:** Min 8 karakter, complexity rules

### Authorization (Yetkilendirme)
- **RBAC Model:** Role-Based Access Control
- **4 Rol Tipi:** tenant_admin, designer, approver, user
- **Resource-Level:** Form/workflow/task seviyesinde izin
- **Dynamic Permissions:** Runtime role evaluation

### API Güvenliği
- **Rate Limiting:** Tenant + user bazlı (Redis)
- **CORS:** Strict allowlist (tenant domain'leri)
- **Input Validation:** Zod schemas
- **SQL Injection:** Prisma ORM (parameterized queries)
- **XSS Prevention:** Output encoding, CSP headers

## Performance & Scalability

### Caching Stratejisi
```typescript
// Redis cache layers
- Auth tokens: `auth:${userId}:token`
- Form definitions: `forms:${tenantId}:published`
- Workflow definitions: `workflows:${tenantId}:published`
- User sessions: `session:${sessionId}`
- Lookup data: `lookup:${tenantId}:roles`
```

### Database Optimizasyon
```sql
-- Kritik indexler
CREATE INDEX idx_tenant_forms ON forms(tenant_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_process_instances_tenant ON process_instances(tenant_id, status);
CREATE INDEX idx_task_instances_assignee ON task_instances(assignee_id, status);
```

### Monitoring & Observability

**Logging (pino):**
```typescript
logger.info({
  traceId, spanId, tenantId, userId,
  action: 'form_created',
  formId: form.id,
  duration: endTime - startTime
});
```

**Metrics (OpenTelemetry):**
- Request latency & throughput
- Database query performance  
- Cache hit ratios
- Business metrics (forms created, processes completed)

**Health Checks:**
```typescript
GET /health → Database, Redis, Queue connection status
GET /health/ready → Service readiness probe
GET /health/live → Service liveness probe
```

## Deployment Mimari

### Development
```
localhost:3000 (Backend API)
localhost:3001 (Admin Panel)  
localhost:3002 (User Portal)
localhost:5432 (PostgreSQL)
localhost:6379 (Redis)
```

### Production  
```
Load Balancer → Multiple Backend Instances
├── Admin Panel (Static hosting)
├── User Portal PWA (CDN)
├── PostgreSQL Cluster (Primary + Replica)
└── Redis Cluster (HA setup)
```

### Container Strategy
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
FROM node:20-alpine AS runtime
EXPOSE 8080
```

## Integration Points

### External Systems
- **ERP/CRM:** REST API webhooks
- **Email:** SMTP + template engine  
- **SMS:** Twilio/AWS SNS integration
- **SSO:** SAML 2.0 + OAuth 2.0
- **File Storage:** S3-compatible (MinIO/AWS)

### Webhook Architecture
```typescript
// Outgoing webhooks (tenant konfigürasyonu)
interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  retry_count: number;
  timeout: number;
}
```

Bu mimari, PLAN.md'deki tüm gereksinimleri karşılayacak şekilde tasarlanmıştır ve horizontal scaling için hazırdır.