# Flowner Sprint Plan

Bu doküman, Flowner projesinin 7 sprint halindeki geliştirme planını detaylandırır.

## Sprint Genel Kuralları

1. **Kaynak Gerçeklik**: Bu dokümandaki kararlar değişmez
2. **Sıralı Geliştirme**: S0→S1→S2→S3→S4→S5→S6
3. **Tam Dosya Üretimi**: Kısmi diff değil, dosyanın tamamı
4. **Smoke Test**: Her sprint sonunda tüm özellikler çalışmalı
5. **Kabul Kriterleri**: Her madde PASS olmalı

---

## Sprint S0: Dokümantasyon İskeleti ✅

**Hedef**: Proje temellerini ve dokümantasyon yapısını oluşturmak

### Deliverables
- [x] `docs/` klasörü yapısı
- [x] Architecture.md (mimari kararları)
- [x] Sprint-plan.md (bu doküman)
- [x] API-design.md (REST endpoints)
- [x] README.md (genel proje bilgisi)

### Kabul Kriterleri
- [x] Tüm dokümantasyon dosyaları tam içerikli
- [x] Mimari kararları net ve uygulanabilir
- [x] Sprint planı detaylı ve açık

---

## Sprint S1: Backend Foundation

**Hedef**: Temel backend altyapısını kurmak

### Deliverables
- [ ] Solution struktur ve dependency management
- [ ] PostgreSQL + Prisma ORM entegrasyonu
- [ ] Multi-tenant veri modeli (tenant_id zorunlu)
- [ ] JWT Authentication + RBAC (4 rol)
- [ ] pino JSON logging + OpenTelemetry setup
- [ ] Health check endpoints
- [ ] Redis cache integration (opsiyonel)
- [ ] Basic error handling + ProblemDetails

### Veri Modeli (Öncelikli Tablolar)
```typescript
// Tenant yönetimi
Tenants, Users, UserRoles

// Form yönetimi  
Forms, FormVersions, FormFields

// Workflow yönetimi
Workflows, WorkflowVersions, WorkflowNodes

// Process runtime
ProcessInstances, TaskInstances
