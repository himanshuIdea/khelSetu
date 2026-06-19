export type AuthMode = "password" | "otp";

export type AuthSidePanelConfig = {
  steps: readonly string[];
  showProgress: boolean;
  activeStep: number;
  progressPercent: number;
};

export type CuratedPortalId = "state" | "admin" | "coach" | "player";

export const ONBOARDING_STEPS = [
  "Account & verification",
  "Academy profile & branding",
  "Add coaches & batches",
  "Invite your players",
] as const;

export const STATE_PORTAL_STEPS = [
  "District overview",
  "Nursery verification",
  "Athlete scouting",
  "Funds & reports",
] as const;

export const COACH_PORTAL_STEPS = [
  "Review submissions",
  "Post drills",
  "Mark attendance",
  "Build teams",
] as const;

export const PLAYER_PORTAL_STEPS = [
  "Watch drills",
  "Submit your form",
  "Track progress",
  "Stay connected",
] as const;

export const portalCrossLinks: ReadonlyArray<{
  id: CuratedPortalId;
  label: string;
  href: string;
}> = [
  { id: "state", label: "State department", href: "/auth/state/login" },
  { id: "admin", label: "Academy admin", href: "/auth/login" },
  { id: "coach", label: "Coach", href: "/auth/coach/login" },
  { id: "player", label: "Athlete", href: "/auth/player/login" },
];

export const authConfig = {
  brand: {
    name: "Khel",
    accentWord: "Setu",
  },
  steps: ONBOARDING_STEPS,
  signUp: {
    activeStep: 0,
    progressPercent: 25,
    title: "Create your account",
    subtitle: "Set up your academy admin account to begin onboarding.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Your full name",
    modes: {
      password: {
        label: "Password",
        identifierLabel: "Username, email, or phone",
        identifierPlaceholder: "rohitsangwan or you@academy.in",
        passwordLabel: "Password",
        passwordPlaceholder: "Create a password",
        confirmPasswordLabel: "Confirm password",
        confirmPasswordPlaceholder: "Re-enter your password",
      },
      otp: {
        label: "OTP",
        phoneLabel: "Phone number",
        phonePlaceholder: "+91 98765 43210",
        otpLabel: "OTP",
        otpPlaceholder: "Enter 6-digit OTP",
      },
    },
    continueLabel: "Continue",
    signInPrompt: "Already have an account?",
    signInLabel: "Sign in",
  },
  login: {
    headline: ["Launch your academy's", "own digital home."],
    subcopy:
      "A fully branded web portal and mobile app for your academy — set up in four simple steps. No code, no IT team needed.",
    activeStep: 0,
    progressPercent: 25,
    sidePanel: {
      steps: ONBOARDING_STEPS,
      showProgress: true,
      activeStep: 0,
      progressPercent: 25,
    },
    title: "Sign in",
    subtitle: "Welcome back. Sign in to manage your academy dashboard.",
    signUpPrompt: "New to Khel Setu?",
    signUpLabel: "Create your account",
    staffSignInPrompt: "Support staff?",
    staffSignInLabel: "Sign in here",
    staffSignInHref: "/auth/staff/login",
    modes: {
      password: {
        label: "Password",
        identifierLabel: "Username, email, or phone",
        identifierPlaceholder: "rohitsangwan or you@academy.in",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        forgotPasswordLabel: "Forgot password?",
      },
      otp: {
        label: "OTP",
        phoneLabel: "Phone number",
        phonePlaceholder: "+91 98765 43210",
        otpLabel: "OTP",
        otpPlaceholder: "Enter 6-digit OTP",
      },
    },
    continueLabel: "Continue",
  },
  portalLogin: {
    state: {
      headline: ["Oversee sports", "across the state."],
      subcopy:
        "Monitor districts, verify nurseries, scout talent, and track funds from one state dashboard.",
      activeStep: 4,
      progressPercent: 0,
      sidePanel: {
        steps: STATE_PORTAL_STEPS,
        showProgress: false,
        activeStep: 4,
        progressPercent: 0,
      },
      title: "State dashboard sign in",
      subtitle: "Welcome back. Sign in with your state department credentials.",
      modes: {
        password: {
          label: "Password",
          identifierLabel: "Email or username",
          identifierPlaceholder: "you@haryanasports.gov.in",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter your password",
          forgotPasswordLabel: "Forgot password?",
        },
        otp: {
          label: "OTP",
          phoneLabel: "Phone number",
          phonePlaceholder: "+91 98765 43210",
          otpLabel: "OTP",
          otpPlaceholder: "Enter 6-digit OTP",
        },
      },
      continueLabel: "Continue",
    },
    player: {
      headline: ["Sign in to your", "athlete app."],
      subcopy: "Use the username and password your academy admin shared with you.",
      activeStep: 4,
      progressPercent: 0,
      sidePanel: {
        steps: PLAYER_PORTAL_STEPS,
        showProgress: false,
        activeStep: 4,
        progressPercent: 0,
      },
      title: "Athlete sign in",
      subtitle: "Enter your username and temporary or chosen password to continue.",
      signUpPrompt: "Academy admin?",
      signUpLabel: "Sign in here",
      signUpHref: "/auth/login",
      modes: {
        password: {
          label: "Password",
          identifierLabel: "Username",
          identifierPlaceholder: "rohitsangwan",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter your password",
          forgotPasswordLabel: "Forgot password?",
        },
      },
      continueLabel: "Continue",
    },
    coach: {
      headline: ["Sign in as", "coach."],
      subcopy: "View your assignments, players, attendance, and teams.",
      activeStep: 4,
      progressPercent: 0,
      sidePanel: {
        steps: COACH_PORTAL_STEPS,
        showProgress: false,
        activeStep: 4,
        progressPercent: 0,
      },
      title: "Coach sign in",
      subtitle: "Welcome back. Sign in to open your coach portal.",
      signUpPrompt: "Academy admin?",
      signUpLabel: "Sign in here",
      signUpHref: "/auth/login",
      modes: {
        password: {
          label: "Password",
          identifierLabel: "Username, email, or phone",
          identifierPlaceholder: "rohitsangwan or you@academy.in",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter your password",
          forgotPasswordLabel: "Forgot password?",
        },
        otp: {
          label: "OTP",
          phoneLabel: "Phone number",
          phonePlaceholder: "+91 98765 43210",
          otpLabel: "OTP",
          otpPlaceholder: "Enter 6-digit OTP",
        },
      },
      continueLabel: "Continue",
    },
    staff: {
      headline: ["Sign in as", "support staff."],
      subcopy: "Access academy operations, attendance, and roster tools.",
      activeStep: 4,
      progressPercent: 0,
      sidePanel: {
        steps: COACH_PORTAL_STEPS,
        showProgress: false,
        activeStep: 4,
        progressPercent: 0,
      },
      title: "Staff sign in",
      subtitle: "Welcome back. Sign in to open your staff dashboard.",
      signUpPrompt: "Academy admin?",
      signUpLabel: "Sign in here",
      signUpHref: "/auth/login",
      modes: {
        password: {
          label: "Password",
          identifierLabel: "Username, email, or phone",
          identifierPlaceholder: "rohitsangwan or you@academy.in",
          passwordLabel: "Password",
          passwordPlaceholder: "Enter your password",
          forgotPasswordLabel: "Forgot password?",
        },
        otp: {
          label: "OTP",
          phoneLabel: "Phone number",
          phonePlaceholder: "+91 98765 43210",
          otpLabel: "OTP",
          otpPlaceholder: "Enter 6-digit OTP",
        },
      },
      continueLabel: "Continue",
    },
  },
  changePassword: {
    headline: ["Secure your", "KhelSetu account."],
    subcopy:
      "Your academy admin issued a temporary password. Choose a new password before continuing.",
    activeStep: 0,
    progressPercent: 25,
    title: "Set a new password",
    subtitle: "Use at least 8 characters. You will use this password for all future sign-ins.",
    currentPasswordLabel: "Temporary password",
    currentPasswordPlaceholder: "Enter the 8-digit password from your admin",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "Choose a new password",
    confirmPasswordLabel: "Confirm new password",
    confirmPasswordPlaceholder: "Re-enter your new password",
    continueLabel: "Save & continue",
  },
  onboarding: {
    activeStep: 1,
    progressPercent: 50,
    title: "Academy profile & branding",
    subtitle:
      "This is how your players and the state dashboard will recognise you.",
    fields: {
      academyName: {
        label: "Academy name",
        defaultValue: "Dronacharya Sports Academy",
      },
      district: {
        label: "District",
        defaultValue: "Sonipat",
        suggestions: [
          "Ambala",
          "Bhiwani",
          "Charkhi Dadri",
          "Faridabad",
          "Fatehabad",
          "Gurugram",
          "Hisar",
          "Jhajjar",
          "Jind",
          "Kaithal",
          "Karnal",
          "Kurukshetra",
          "Mahendragarh",
          "Nuh",
          "Palwal",
          "Panchkula",
          "Panipat",
          "Rewari",
          "Rohtak",
          "Sirsa",
          "Sonipat",
          "Yamunanagar",
        ] as const,
      },
      brandedLink: {
        label: "Your branded link",
        defaultValue: "ambala-1",
        suffix: ".khelsetu.in",
        hint: "3–40 characters. Lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.",
      },
      sports: {
        label: "Sports offered",
        defaultSports: ["Wrestling", "Boxing", "Athletics", "Kabaddi"],
        suggestions: [
          "Wrestling",
          "Boxing",
          "Athletics",
          "Kabaddi",
          "Hockey",
          "Football",
          "Cricket",
          "Judo",
          "Taekwondo",
          "Weightlifting",
          "Badminton",
          "Volleyball",
        ] as const,
        addLabel: "Add sport",
      },
      funding: {
        label: "Funding type",
        options: ["Govt-aided", "Private"] as const,
        defaultValue: "Govt-aided" as const,
      },
      brandColour: {
        label: "Brand colour",
        colors: ["#FF6B2C", "#12B886", "#2F6BFF", "#7C5CFC", "#E11D48"] as const,
        defaultValue: "#FF6B2C" as const,
      },
    },
    backLabel: "Back",
    continueLabel: "Submit for verification",
  },
} as const;
