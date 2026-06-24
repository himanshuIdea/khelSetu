import {
  authConfig,
  COACH_PORTAL_STEPS,
  ONBOARDING_STEPS,
  PLAYER_PORTAL_STEPS,
  STATE_PORTAL_STEPS,
} from "@/lib/auth-config";

export type PortalLandingId = "state" | "admin" | "coach" | "player";

export type PortalLandingLayout = "balanced" | "mobileFirst";

export type PortalLandingConfig = {
  headline: readonly string[] | string;
  subcopy: string;
  steps: readonly string[];
  activeStep: number;
  signInHref: string;
  landingHref: string;
  showSignUp: boolean;
  signUpHref?: string;
  layout: PortalLandingLayout;
  helperText?: string;
};

const { login, portalLogin } = authConfig;

export const portalLandingConfig: Record<PortalLandingId, PortalLandingConfig> = {
  state: {
    headline: portalLogin.state.headline,
    subcopy: portalLogin.state.subcopy,
    steps: STATE_PORTAL_STEPS,
    activeStep: 0,
    signInHref: "/auth/state/login",
    landingHref: "/",
    showSignUp: false,
    layout: "balanced",
  },
  admin: {
    headline: login.headline,
    subcopy: login.subcopy,
    steps: ONBOARDING_STEPS,
    activeStep: 0,
    signInHref: "/auth/login",
    landingHref: "/academy",
    showSignUp: true,
    signUpHref: "/auth/sign-up",
    layout: "balanced",
  },
  coach: {
    headline: portalLogin.coach.headline,
    subcopy: portalLogin.coach.subcopy,
    steps: COACH_PORTAL_STEPS,
    activeStep: 0,
    signInHref: "/auth/coach/login",
    landingHref: "/coach",
    showSignUp: false,
    layout: "balanced",
    helperText: "Use the credentials your academy admin shared with you.",
  },
  player: {
    headline: portalLogin.player.headline,
    subcopy: portalLogin.player.subcopy,
    steps: PLAYER_PORTAL_STEPS,
    activeStep: 0,
    signInHref: "/auth/player/login",
    landingHref: "/player",
    showSignUp: false,
    layout: "mobileFirst",
    helperText: "Use the credentials your academy admin shared with you.",
  },
};

export function getPortalLandingConfig(portal: PortalLandingId): PortalLandingConfig {
  return portalLandingConfig[portal];
}

export function getPortalBrandHref(portal: PortalLandingId): string {
  return portalLandingConfig[portal].landingHref;
}

export const PUBLIC_PORTAL_LANDING_PATHS = new Set(
  Object.values(portalLandingConfig).map((config) => config.landingHref)
);
