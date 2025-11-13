# Navigation Audit

| Enlace del menú | Ruta | ¿Quién lo ve? (Header) | Feature flag |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Cualquier usuario autenticado | N/A |
| Evaluaciones | `/evaluations` | Cualquier usuario autenticado | N/A |
| Reportes | `/reports` | Cualquier usuario autenticado | N/A |
| Dashboard 360° | `/dashboard-360` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_DASHBOARD_360` |
| Acciones Masivas | `/bulk-actions` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_BULK_ACTIONS` |
| Alertas | `/alerts` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_OPERATIONAL_ALERTS` |
| Políticas | `/policies` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_ORG_POLICIES` |
| Comparativas | `/comparison` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_CAMPAIGN_COMPARISON` |
| Admin Tests | `/admin/tests` | Solo super admins (emails autorizados o roles super_admin/platform_admin) | N/A |

> Nota: Los enlaces de administración ahora viven en dos menús desplegables. “Gestión” agrupa las funciones de la organización (visible solo para roles administradores) y “Super Admin” concentra las utilidades globales de plataforma.

## Estado actual de feature flags (`organizations/pilot-org-santiago`)

```json
{
  "FEATURE_BULK_ACTIONS": true,
  "FEATURE_DASHBOARD_360": true,
  "FEATURE_CAMPAIGN_COMPARISON": true,
  "FEATURE_ORG_POLICIES": true,
  "FEATURE_OPERATIONAL_ALERTS": true
}
```







| Enlace del menú | Ruta | ¿Quién lo ve? (Header) | Feature flag |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Cualquier usuario autenticado | N/A |
| Evaluaciones | `/evaluations` | Cualquier usuario autenticado | N/A |
| Reportes | `/reports` | Cualquier usuario autenticado | N/A |
| Dashboard 360° | `/dashboard-360` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_DASHBOARD_360` |
| Acciones Masivas | `/bulk-actions` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_BULK_ACTIONS` |
| Alertas | `/alerts` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_OPERATIONAL_ALERTS` |
| Políticas | `/policies` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_ORG_POLICIES` |
| Comparativas | `/comparison` | Solo admins de organización (roles: owner/admin/administrator/...) con flag activo | `FEATURE_CAMPAIGN_COMPARISON` |
| Admin Tests | `/admin/tests` | Solo super admins (emails autorizados o roles super_admin/platform_admin) | N/A |

> Nota: Los enlaces de administración ahora viven en dos menús desplegables. “Gestión” agrupa las funciones de la organización (visible solo para roles administradores) y “Super Admin” concentra las utilidades globales de plataforma.

## Estado actual de feature flags (`organizations/pilot-org-santiago`)

```json
{
  "FEATURE_BULK_ACTIONS": true,
  "FEATURE_DASHBOARD_360": true,
  "FEATURE_CAMPAIGN_COMPARISON": true,
  "FEATURE_ORG_POLICIES": true,
  "FEATURE_OPERATIONAL_ALERTS": true
}
```










