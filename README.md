# Flowner - Business Process Management Platform

A modern, multi-tenant BPMN-based business process management platform built with Node.js, Express, React, and PostgreSQL.

## 🌐 Application URLs

### Admin Panel (tenant_admin, designer)
- **Dashboard**: `/admin/dashboard` - Ana yönetim paneli
- **İş Akışları**: `/admin/workflows` - BPMN workflow tasarımı ve yönetimi
- **Formlar**: `/admin/forms` - Form builder ve version yönetimi
- **Süreçler**: `/admin/processes` - Process instance monitoring
- **Görevler**: `/admin/tasks` - Task management ve assignment
- **Analitik**: `/admin/analytics` - Performance ve istatistikler

### User Portal (approver, user)
- **Gelen Kutusu**: `/portal/inbox` - Bekleyen task'lar ve bildirimler
- **Görevlerim**: `/portal/tasks` - Atanan task'ların listesi
- **Task Detay**: `/portal/tasks/:id` - Spesifik task detayı ve form completion
- **Tamamlanan**: `/portal/completed` - Tamamlanmış task geçmişi
- **Geç Kalanlar**: `/portal/overdue` - SLA aşan task'lar
- **Profilim**: `/portal/profile` - Kullanıcı profil ayarları

### Shared Routes
- **Login**: `/login` - Authentication (role-based redirect)
- **Logout**: Header menü - Session termination

## 🔐 Role-Based Access Control (RBAC)

| Role | Access | Default Route | Features |
|------|--------|---------------|----------|
| `tenant_admin` | Admin Panel | `/admin/dashboard` | Full system management, tenant configuration |
| `designer` | Admin Panel | `/admin/dashboard` | Workflow design, form creation, process management |
| `approver` | User Portal | `/portal/inbox` | Task approval, process execution |
| `user` | User Portal | `/portal/inbox` | Task completion, form submission |

## 🎨 UI Features

### Header Components
- **Tenant Seçici**: Multi-tenant environment switching
- **Dil/Tema Tuşları**: Türkçe/English, Light/Dark mode
- **User Menu**: Profil, ayarlar, çıkış işlemleri

### Layout System
- **Admin Layout**: Full-featured sidebar, stats dashboard
- **Portal Layout**: Task-focused navigation, notification badges
- **Responsive Design**: Mobile-friendly Material-UI components

## 🚀 Getting Started

### Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|---------|
| Tenant Admin | admin@demo.local | Passw0rd! | Full admin panel |
| Designer | designer@demo.local | Designer123! | Workflow/Form design |
| Approver | approver@demo.local | Approver123! | Task approval portal |
| User | user@demo.local | User123! | Task execution portal |

### Development Setup

```bash
# Start the application
npm run dev

# Access the application
Admin Panel: http://localhost:5000/admin/dashboard
User Portal: http://localhost:5000/portal/inbox
```

## 🎯 S4 Sprint - User Portal Form Integration ✅

### Completed Features
- **Dynamic Form Rendering**: FormRenderer component with validation, conditional logic
- **Task-Form Integration**: User Portal task detail with form submission
- **Process Monitoring**: Enhanced admin monitoring with auto-refresh, audit timeline
- **Demo Workflows**: Expense approval with auto-approve/manual approval logic
- **Backend APIs**: Complete task/form integration endpoints

### Demo Scenarios
- **Auto-approve**: Expenses ≤ 1000 TRY automatically approved
- **Manual approval**: Expenses > 1000 TRY require manager approval
- **Form Validation**: Required fields, min/max values, Turkish localization

## 📱 Navigation Examples

### Admin Workflow
1. Login as admin@demo.local → Redirected to `/admin/dashboard`
2. Create workflow → Navigate to `/admin/workflows`
3. Design forms → Navigate to `/admin/forms`
4. Monitor processes → Navigate to `/admin/processes`

### User Workflow
1. Login as user@demo.local → Redirected to `/portal/inbox`
2. View pending tasks → Stay in `/portal/inbox`
3. Complete task → Navigate to `/portal/tasks/:id`
4. Return to inbox → Navigate back to `/portal/inbox`

## 🔄 Automatic Redirects

- **Unauthenticated users** → `/login`
- **Admin/Designer roles** → `/admin/dashboard`
- **Approver/User roles** → `/portal/inbox`
- **Invalid routes** → Role-appropriate default route

## 🧪 Testing

```bash
# Run S4 UI smoke tests
cd tests && ./s4-ui-smoke-test.sh

# Expected output: S4_UI=PASS
```

---

**Tech Stack**: Node.js, Express, React 18, Material-UI, PostgreSQL, TypeScript, BPMN.js