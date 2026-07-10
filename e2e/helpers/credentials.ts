export function requireStateAdminCredentials(): { email: string; password: string } {
  const email = process.env.STATE_ADMIN_EMAIL?.trim();
  const password = process.env.STATE_ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      "STATE_ADMIN_EMAIL and STATE_ADMIN_PASSWORD must be set in .env or .env.local for the demo recording."
    );
  }

  return { email, password };
}
