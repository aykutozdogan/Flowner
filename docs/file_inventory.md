# Flowner - Dosya Envanteri

## 📊 Genel İstatistikler
- **Toplam TypeScript dosyası**: 1504 (.ts/.tsx/.js/.jsx files)
- **React component dosyası**: 110 (.tsx files)
- **Admin page dosyası**: 8 (AdminDashboard, Settings, Tasks, etc.)
- **Portal page dosyası**: 7 (PortalInbox, Profile, Forms, etc.)
- **Layout dosyası**: 4 (AdminSidebar, PortalSidebar, Header, layouts)

## 📁 Kritik Dosyalar ve Durumları

### Layout Components
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| AdminSidebar.tsx | client/src/components/layout/ | ❌ | ✅ | ✅ Çalışıyor | Medium |
| PortalSidebar.tsx | client/src/components/layout/ | ❌ | ✅ | ✅ Çalışıyor | Medium |
| AppHeader.tsx | client/src/components/layout/ | ✅ | ❌ | ⚠️ MUI Hybrid | High |
| AdminLayout.tsx | client/src/components/layout/ | ❌ | ✅ | ✅ Çalışıyor | Low |
| PortalLayout.tsx | client/src/components/layout/ | ❌ | ✅ | ✅ Çalışıyor | Low |

### Form Components  
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| FormRenderer.tsx | client/src/components/ | ✅ | ✅ | ❌ LSP Errors (20) | Critical |
| FormBuilder.tsx | client/src/components/forms/ | ✅ | ✅ | ⚠️ MUI Heavy | High |

### Workflow Components
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| BpmnDesigner.tsx | client/src/components/workflows/ | ✅ | ❌ | ⚠️ Full MUI | High |

### Dashboard Components
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| stats-cards.tsx | client/src/components/dashboard/ | ❌ | ✅ | ✅ Çalışıyor | Low |
| recent-activity.tsx | client/src/components/dashboard/ | ✅ | ❌ | ⚠️ Full MUI | Medium |
| active-processes.tsx | client/src/components/dashboard/ | ✅ | ❌ | ⚠️ Full MUI | Medium |
| system-health.tsx | client/src/components/dashboard/ | ✅ | ❌ | ⚠️ Full MUI | Medium |
| quick-actions.tsx | client/src/components/dashboard/ | ✅ | ✅ | ⚠️ MUI Heavy | Medium |

### Admin Pages
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| AdminDashboard.tsx | client/src/pages/admin/ | ❌ | ✅ | ✅ Çalışıyor | Low |
| FormsPage.tsx | client/src/pages/admin/ | ❌ | ✅ | ✅ Çalışıyor | Low |
| UsersPage.tsx | client/src/pages/admin/ | ❌ | ? | ❓ Unknown | Medium |
| TenantsPage.tsx | client/src/pages/admin/ | ❌ | ? | ❓ Unknown | Medium |
| FormBuilderPage.tsx | client/src/pages/admin/ | ❌ | ? | ❓ Unknown | Medium |
| BpmnDesignerPage.tsx | client/src/pages/admin/ | ❌ | ? | ❓ Unknown | Medium |

### Portal Pages
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| Portal.tsx | client/src/pages/ | ❌ | ✅ | ✅ Çalışıyor | Low |
| PortalInbox.tsx | client/src/pages/portal/ | ❌ | ? | ❓ Unknown | Medium |
| PortalProfile.tsx | client/src/pages/portal/ | ❌ | ✅ | ❓ Unknown | Medium |
| PortalForms.tsx | client/src/pages/portal/ | ❌ | ✅ | ❓ Unknown | Medium |

### Core Pages
| Dosya | Lokasyon | Material-UI | DevExtreme | Durum | Öncelik |
|-------|----------|-------------|------------|--------|---------|
| login.tsx | client/src/pages/ | ✅ | ✅ | ✅ Hybrid Working | Low |
| workflows.tsx | client/src/pages/ | ✅ | ❌ | ⚠️ Full MUI | High |
| TaskDetail.tsx | client/src/pages/ | ✅ | ❌ | ⚠️ Full MUI | Medium |

## 🔍 Analysis Commands Results
```bash
# Total TypeScript files in client/server
find . -name "*.tsx" -o -name "*.ts" | wc -l
# Result: 1504

# TSX React component files  
find client/src -name "*.tsx" | wc -l
# Result: 110

# Files still using Material-UI
grep -r "@mui/material" client/src/ | wc -l  
# Result: 12 files

# Files using DevExtreme
grep -r "devextreme-react" client/src/ | wc -l
# Result: 30 files
```

## 📈 Migration Progress Summary
- **Total Component Files**: 110 TSX files
- **DevExtreme Converted**: 30 files (~27%)
- **Material-UI Remaining**: 12 files (~11%)
- **Mixed/Hybrid State**: ~8 files
- **Unknown Status**: ~60 files (need inspection)

## 🎯 Priority Matrix
### Critical (Must Fix Today)
- FormRenderer.tsx (LSP errors)

### High Priority (This Week)  
- FormBuilder.tsx (full MUI conversion)
- BpmnDesigner.tsx (full MUI conversion)
- AppHeader.tsx (mixed state cleanup)
- workflows.tsx (full MUI conversion)

### Medium Priority (Next Week)
- Dashboard components (4 files)
- TaskDetail.tsx conversion
- Unknown status page inspections

### Low Priority (Future)
- Theme optimization
- Legacy cleanup
- Performance improvements