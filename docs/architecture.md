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

**Port:** 5000 (development & production unified)

### 2. Admin Panel (React + Material-UI)

**Teknoloji Stack:**
- React 18 + TypeScript
- Material-UI v5 + React Hook Form
- wouter routing + TanStack Query
- Drag-drop form builder
- bpmn-js (BPMN designer)

**Sorumluluklar:**
- Form tasarlayıcısı (drag-drop, field types, validation)
- BPMN workflow designer (görsel editör)
- Kullanıcı ve tenant yönetimi
- Süreç izleme ve raporlama
- Sistem konfigürasyonu
- Role-based menü görünürlüğü

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

## Veri Akışları

### Form Tasarım Akışı
