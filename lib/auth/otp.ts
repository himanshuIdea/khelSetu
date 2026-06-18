/**
 * Stub OTP verification for local development.
 * In production, OTP is rejected unless OTP_STUB_ENABLED=true (use a real SMS provider).
 */
export async function verifyOtpChallenge(_phone: string, otp: string): Promise<boolean> {
  if (process.env.NODE_ENV === "production" && process.env.OTP_STUB_ENABLED !== "true") {
    return false;
  }
  return otp.trim().length > 0;
}
