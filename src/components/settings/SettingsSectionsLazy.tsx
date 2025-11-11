import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load de seções pesadas de configurações
const CompanyInfo = lazy(() => 
  import('@/components/settings/CompanyInfo').then(m => ({ default: m.CompanyInfo }))
);
const CompanyUsersManager = lazy(() => 
  import('@/components/settings/CompanyUsersManager').then(m => ({ default: m.CompanyUsersManager }))
);
const SuperAdminDashboard = lazy(() => 
  import('@/components/settings/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard }))
);
const CorporateGroupManager = lazy(() => 
  import('@/components/settings/CorporateGroupManager').then(m => ({ default: m.CorporateGroupManager }))
);
const BillingSection = lazy(() => 
  import('@/components/settings/BillingSection').then(m => ({ default: m.BillingSection }))
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

export function CompanyInfoLazy(props: any) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CompanyInfo {...props} />
    </Suspense>
  );
}

export function CompanyUsersManagerLazy(props: any) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CompanyUsersManager {...props} />
    </Suspense>
  );
}

export function SuperAdminDashboardLazy(props: any) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SuperAdminDashboard {...props} />
    </Suspense>
  );
}

export function CorporateGroupManagerLazy(props: any) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CorporateGroupManager {...props} />
    </Suspense>
  );
}

export function BillingSectionLazy(props: any) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BillingSection {...props} />
    </Suspense>
  );
}
