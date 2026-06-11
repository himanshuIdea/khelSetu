export type AuthMode = "password" | "otp";

export const authConfig = {
  brand: {
    name: "Khel",
    accentWord: "Setu",
  },
  steps: [
    "Account & verification",
    "Academy profile & branding",
    "Add coaches & batches",
    "Invite your players",
  ],
  login: {
    headline: ["Launch your academy's", "own digital home."],
    subcopy:
      "A fully branded web portal and mobile app for your academy — set up in four simple steps. No code, no IT team needed.",
    activeStep: 0,
    progressPercent: 25,
    title: "Account & verification",
    subtitle: "Sign in or create your academy admin account to get started.",
    modes: {
      password: {
        label: "Password",
        identifierLabel: "Email or phone number",
        identifierPlaceholder: "you@academy.in or +91 98765 43210",
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
          "Sonipat",
          "Rohtak",
          "Panipat",
          "Karnal",
          "Ambala",
          "Gurugram",
          "Faridabad",
          "Hisar",
          "Bhiwani",
          "Jind",
          "Kaithal",
          "Kurukshetra",
        ] as const,
      },
      brandedLink: {
        label: "Your branded link",
        defaultValue: "dronacharya",
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
    continueLabel: "Continue",
  },
} as const;
