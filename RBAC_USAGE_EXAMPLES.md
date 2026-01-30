# 🔐 RBAC Usage Examples

**Como usar o sistema de RBAC no código**

---

## 📦 1. CLIENT-SIDE (React Components)

### Exemplo 1: Mostrar conteúdo apenas para admins

```tsx
import { AdminOnly } from '@/components/rbac';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Só admins veem isso */}
      <AdminOnly>
        <button>Manage Users</button>
        <button>System Settings</button>
      </AdminOnly>
    </div>
  );
}
```

### Exemplo 2: Mostrar conteúdo para VIP clients e admins

```tsx
import { VIPOnly } from '@/components/rbac';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* VIP e admins veem isso */}
      <VIPOnly>
        <Link href="/human-vault">🔒 Human Vault</Link>
        <Link href="/crypto-payments">₿ Crypto Payments</Link>
      </VIPOnly>
    </div>
  );
}
```

### Exemplo 3: Verificar permissões específicas

```tsx
import { PermissionGate } from '@/components/rbac';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Só quem tem permissão de gerenciar entregas */}
      <PermissionGate permission="canManageDeliveries">
        <button>Create Delivery</button>
        <button>Cancel Delivery</button>
      </PermissionGate>

      {/* Só quem tem acesso ao GPS */}
      <PermissionGate permission="canAccessGPS">
        <GPSTracker />
      </PermissionGate>
    </div>
  );
}
```

### Exemplo 4: Usar o hook useRBAC diretamente

```tsx
'use client';

import { useRBAC } from '@/hooks/useRBAC';

export default function Dashboard() {
  const {
    isAdmin,
    isVIP,
    canAccessHumanVault,
    hasPermission
  } = useRBAC();

  return (
    <div>
      <h1>Dashboard</h1>

      {isAdmin && <AdminPanel />}
      {isVIP && <VIPFeatures />}
      {canAccessHumanVault && <HumanVaultLink />}

      {hasPermission('canManageUsers') && (
        <UserManagement />
      )}
    </div>
  );
}
```

---

## 🔧 2. SERVER-SIDE (API Routes)

### Exemplo 1: Proteger rota apenas para admins

```typescript
// app/api/admin/users/route.ts
import { requireAdmin } from '@/middleware/rbac';

export async function GET(request: NextRequest) {
  // Verificar se é admin
  const authResult = await requireAdmin();

  if (authResult instanceof NextResponse) {
    return authResult; // Return 401/403 error
  }

  const { user } = authResult;

  // Admin confirmado, continuar...
  return NextResponse.json({ users: [...] });
}
```

### Exemplo 2: Proteger rota para múltiplos roles

```typescript
// app/api/human-vault/route.ts
import { requireRole } from '@/middleware/rbac';

export async function POST(request: NextRequest) {
  // Apenas admin e vip_client
  const authResult = await requireRole(['admin', 'vip_client']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Autorizado, continuar...
  return NextResponse.json({ success: true });
}
```

### Exemplo 3: Verificar permissão específica

```typescript
// app/api/deliveries/[id]/status/route.ts
import { requirePermission } from '@/middleware/rbac';

export async function PATCH(request: NextRequest) {
  // Verificar se tem permissão para atualizar status
  const authResult = await requirePermission('canUpdateDeliveryStatus');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Autorizado (admin ou courier), continuar...
  return NextResponse.json({ success: true });
}
```

---

## 🎯 3. ROLES E PERMISSÕES

### Roles disponíveis:
- **admin** → Acesso total
- **vip_client** → Cliente premium
- **courier** → Motorista
- **client** → Cliente padrão

### Permissões disponíveis:

```typescript
interface RolePermissions {
  canAccessDashboard: boolean;
  canManageDeliveries: boolean;
  canManageUsers: boolean;
  canAccessHumanVault: boolean;
  canAccessCryptoPayments: boolean;
  canManageSettings: boolean;
  canViewAllDeliveries: boolean;
  canViewOwnDeliveries: boolean;
  canUpdateDeliveryStatus: boolean;
  canAccessGPS: boolean;
}
```

### Matriz de permissões:

| Permissão | Admin | VIP Client | Courier | Client |
|-----------|-------|------------|---------|--------|
| canAccessDashboard | ✅ | ✅ | ✅ | ✅ |
| canManageDeliveries | ✅ | ❌ | ❌ | ❌ |
| canManageUsers | ✅ | ❌ | ❌ | ❌ |
| canAccessHumanVault | ✅ | ✅ | ❌ | ❌ |
| canAccessCryptoPayments | ✅ | ✅ | ❌ | ❌ |
| canManageSettings | ✅ | ❌ | ❌ | ❌ |
| canViewAllDeliveries | ✅ | ❌ | ❌ | ❌ |
| canViewOwnDeliveries | ✅ | ✅ | ✅ | ✅ |
| canUpdateDeliveryStatus | ✅ | ❌ | ✅ | ❌ |
| canAccessGPS | ✅ | ❌ | ✅ | ❌ |

---

## 📝 4. QUICK START

### Para adicionar RBAC em uma página existente:

1. **Importe os componentes:**
```tsx
import { AdminOnly, VIPOnly, PermissionGate } from '@/components/rbac';
```

2. **Envolva o conteúdo condicional:**
```tsx
<AdminOnly>
  <AdminContent />
</AdminOnly>

<VIPOnly>
  <VIPFeatures />
</VIPOnly>
```

3. **Para verificações mais complexas, use o hook:**
```tsx
import { useRBAC } from '@/hooks/useRBAC';

const { isAdmin, hasPermission } = useRBAC();
```

---

**Pronto para usar!** 🚀
