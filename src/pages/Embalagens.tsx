import { lazy, Suspense } from "react";
import { Archive, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));

export default function Embalagens() {
  return (
    <PageWrapper>
      <EmbalagensTab />
    </PageWrapper>
  );
}
