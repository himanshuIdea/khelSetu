import { Suspense } from "react";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-muted text-sm">
      Loading…
    </div>
  );
}

export default function CoachLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PortalLoginForm portal="coach" />
    </Suspense>
  );
}
