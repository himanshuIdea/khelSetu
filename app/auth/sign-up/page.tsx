import { AuthShell } from "@/components/auth/AuthShell";
import { UserSignUpForm } from "@/components/auth/UserSignUpForm";
import { authConfig } from "@/lib/auth-config";
import { redirectIfAuthenticated } from "@/lib/auth/redirect";

export default async function SignUpPage() {
  await redirectIfAuthenticated("admin");

  const { login, signUp } = authConfig;

  return (
    <AuthShell
      headline={login.headline}
      subcopy={login.subcopy}
      activeStep={signUp.activeStep}
      progressPercent={signUp.progressPercent}
    >
      <UserSignUpForm />
    </AuthShell>
  );
}
