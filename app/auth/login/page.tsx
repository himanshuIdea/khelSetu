import { Suspense } from "react";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { redirectIfAuthenticated } from "@/lib/auth/redirect";

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-muted text-sm">
      Loading…
    </div>
  );
}

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { next } = await searchParams;
  await redirectIfAuthenticated("admin", next);

  return (
    <Suspense fallback={<LoginFallback />}>
      <PortalLoginForm portal="admin" />
    </Suspense>
  );
}
