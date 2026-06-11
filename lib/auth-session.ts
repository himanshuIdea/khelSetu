import type { AuthMode } from "@/lib/auth-config";

const SESSION_KEY = "khelsetu:onboarding-session";

export type OnboardingSession = {
  mode: AuthMode;
  identifier?: string;
  phone?: string;
};

export function saveOnboardingSession(session: OnboardingSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getOnboardingSession(): OnboardingSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingSession;
  } catch {
    return null;
  }
}

export function clearOnboardingSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
