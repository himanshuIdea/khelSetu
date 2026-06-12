/**
 * Stub OTP verification — always accepts non-empty OTP for now.
 * Replace with challenge lookup + SMS provider when OTP is implemented.
 */
export async function verifyOtpChallenge(
  _phone: string,
  otp: string
): Promise<boolean> {
  return otp.trim().length > 0;
}
